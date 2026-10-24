// The model the static site is built from. Reads the registry and the observations and derives
// everything a page, a feed, llms.txt, or things.json needs, so templates stay thin.
//
// Status is a decision; activity is evidence. The model keeps them apart: `status` comes from the
// registry only, and `latest` and `months` come from observations only.
import { stringify } from 'yaml';
import {
  githubKey,
  websiteKey,
  type Artifact,
  type ArtifactFile,
  type CommitLogObservation,
  type Connection,
  type GitHubObservation,
  type HistoryEvent,
  type MonthCount,
  type Observation,
  type PublicationsObservation,
  type Registry,
  type ScreenshotObservation,
  type Status,
  type Thing,
  type ThingSource,
  type TinylyticsObservation,
  type Topic,
  type WaybackObservation,
  type WebObservation
} from './schema';
import { capturedUrl } from './adapters/wayback';
import { artifactKind, formatBytes, isImage } from './artifacts';
import { rootOrigin, siteKey } from './adapters/tinylytics';
import {
  activityMonths,
  countsAsActivity,
  activitySummary,
  buildActivity,
  type Activity,
  type ActivityDay,
  type ThingRecord
} from './activity';

export const siteUrl = 'https://thingelstad.xyz';
const siteTitle = 'Things I’ve built.';
const siteDescription =
  'An index and archive of my projects, including the ones I’ve stepped away from. By Jamie Thingelstad.';
const repositoryUrl = 'https://github.com/jthingelstad/thingelstad.xyz';

const statusLabels: Record<Status, string> = {
  active: 'Active',
  dormant: 'Dormant',
  retired: 'Retired',
  abandoned: 'Abandoned',
  archived: 'Archived'
};
const statusDescriptions: Record<Status, string> = {
  active: 'Being built or operated.',
  dormant: 'Not currently worked on, and may return.',
  retired: 'Deliberately ended.',
  abandoned: 'Tried, and given up before it worked out.',
  archived: 'Complete and preserved as it is.'
};
const collectionOrder = [
  'Publishing',
  'Games and communities',
  'Developer tools and systems',
  'Personal tools and making',
  'Art & archives',
  'Historical projects'
];

type Evidence = { date: string; label: string; url: string | null };
type SiteSource = ThingSource & {
  observation: GitHubObservation | WebObservation | null;
  captures?: WaybackObservation | null; // website sources only: Internet Archive captures
  views?: TinylyticsObservation | null; // website roots only: page views counted by Tinylytics
  screenshot?: ScreenshotObservation | null; // website roots only: the front page, captured monthly
  evidence: Evidence[];
};
// The front page as it looked on the day it was captured. The JPEG is published under /assets/ with its
// hash in the name, so a new capture is a new file and the old one stays for open pages.
type SiteScreenshot = {
  src: string;
  site: string; // the URL that was captured
  host: string;
  date: string; // YYYY-MM-DD
  width: number;
  height: number;
  alt: string;
};
// Page views for the site a thing is, over the window Tinylytics was asked about.
type SiteViews = { site: string; total: number; until: string; months: MonthCount[] };
export const screenshotAsset = (observation: ScreenshotObservation) =>
  `/assets/screenshots/${observation.image.replace(/\.jpg$/, '')}-${observation.sha256.slice(0, 10)}.jpg`;
type InboundConnection = Connection & { from: string };
// An artifact as its page shows it: where it is published, what kind of file it is and how big, and the image
// that shows it, which is the file itself or its preview (null for a file with neither).
type SiteArtifact = Artifact & {
  src: string;
  kind: string;
  bytes: number;
  size: string;
  image: { src: string; width: number; height: number } | null;
};
const artifactPath = (id: string, file: string) => `/things/${id}/artifacts/${file}`;
function siteArtifact(id: string, artifact: Artifact, files: Map<string, ArtifactFile> | undefined): SiteArtifact {
  const measured = (file: string) => {
    const found = files?.get(`${id}/${file}`);
    if (!found) throw new Error(`The artifact ${id}/${file} was not measured; load the registry with loadRegistry.`);
    return found;
  };
  const { bytes } = measured(artifact.file);
  const shown = isImage(artifact.file) ? artifact.file : artifact.preview;
  const image = shown ? measured(shown) : null;
  return {
    ...artifact,
    src: artifactPath(id, artifact.file),
    kind: artifactKind(artifact.file),
    bytes,
    size: formatBytes(bytes),
    image: shown && image ? { src: artifactPath(id, shown), width: image.width!, height: image.height! } : null
  };
}
// The artifact as its record has it, with its address: what the Markdown twin and things.json carry.
const artifactRecord = ({ src, kind: _k, bytes: _b, size: _s, image: _i, ...artifact }: SiteArtifact) => ({
  ...artifact,
  url: `${siteUrl}${src}`
});
// A small monogram "sticker" for each thing: its initials on a tinted tile, tilted a degree or two. The
// hue and tilt come from the id, so a thing keeps its sticker from build to build.
export type Sticker = { letters: string; hue: number; tilt: number };
export function sticker(id: string, title: string): Sticker {
  let hash = 7;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 1_000_003;
  const words = title.split(/[\s/-]+/).filter((word) => /[\p{L}\p{N}]/u.test(word));
  const letters = (words.length > 1 ? words[0][0] + words[1][0] : title.slice(0, 2)).toUpperCase();
  return { letters, hue: hash % 360, tilt: (hash % 7) - 3 };
}

export type SiteThing = Omit<Thing, 'sources' | 'artifacts'> & {
  page: string;
  markdown: string;
  statusLabel: string;
  statusDescription: string;
  sticker: Sticker;
  sources: SiteSource[];
  events: HistoryEvent[];
  inbound: InboundConnection[];
  topicList: (Topic & { page: string })[];
  latest: Evidence | null; // the newest dated evidence across every source
  months: MonthCount[]; // commits and publications per month, last twelve months
  screenshot: SiteScreenshot | null;
  artifacts: SiteArtifact[];
  views: SiteViews | null;
  span: { start: number | null; end: number | null }; // years, for the timeline
  filters: ThingFilter[]; // its facet values, for /search/
  activity: ThingRecord | null; // its commits and publications over its life, from the logs
};
// The facets of /search/. Each thing's row carries its values (data-filters), and the search page lists every
// value with how many things carry it. A value is a stable slug for the address (?topic=mediawiki); its label
// is what a reader sees. The language is the top one GitHub reports for each of the thing's repositories:
// evidence, like every observation, and never a statement about it.
type FacetName = 'status' | 'collection' | 'topic' | 'year' | 'language';
type ThingFilter = { name: FacetName; value: string; label: string };
type FacetValue = { value: string; label: string; count: number };
type Facet = { name: FacetName; label: string; values: FacetValue[]; most: number }; // most: the largest count
const facetSlug = (label: string) =>
  label
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
type SiteTopic = Topic & { page: string; things: SiteThing[] };
type SiteCollection = { name: string; things: SiteThing[] };
type SiteYear = { year: string; events: HistoryEvent[] };
export type TimelineRow = {
  thing: SiteThing;
  start: number;
  end: number;
  events: { event: HistoryEvent; year: number }[];
};
export type TimelineYear = {
  year: number;
  alive: { status: Status; count: number }[]; // things whose span covers the year, by status
  total: number;
  started: TimelineRow[]; // newest start first
  ended: TimelineRow[]; // things that ended this year after starting earlier
  events: number;
};
export type Timeline = {
  firstYear: number;
  lastYear: number;
  rows: TimelineRow[];
  years: TimelineYear[]; // newest first
  mostAlive: number;
  undated: SiteThing[];
};
export type SiteModel = {
  url: string;
  title: string;
  description: string;
  repository: string;
  generated: string;
  things: SiteThing[];
  featured: SiteThing[]; // in the order of content/featured.yaml
  collections: SiteCollection[];
  topics: SiteTopic[];
  history: HistoryEvent[];
  years: SiteYear[];
  timeline: Timeline;
  statuses: { status: Status; label: string; description: string; count: number }[];
  facets: Facet[];
  activity: Activity;
};

// Dates keep the precision the source gave them: YYYY, YYYY-MM, or YYYY-MM-DD.
export function formatDate(date: string) {
  if (date.length === 4) return date;
  const value = new Date(`${date.length === 7 ? `${date}-01` : date}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    ...(date.length === 10 ? { day: 'numeric' } : {})
  }).format(value);
}
// Stars and forks show only where other people picked a repository up. Below this they say nothing
// about the work, and observations collected before the counts existed have neither.
export const reachThreshold = 10;
export function reach(observation: { stars?: number; forks?: number }) {
  const stars = observation.stars ?? 0;
  if (stars < reachThreshold) return null;
  const plural = (n: number, word: string) =>
    `${new Intl.NumberFormat('en-US').format(n)} ${word}${n === 1 ? '' : 's'}`;
  return `${plural(stars, 'star')} and ${plural(observation.forks ?? 0, 'fork')} on GitHub`;
}
// Feeds need an instant. A coarse date becomes the start of its period, in UTC.
export function toInstant(date: string) {
  const full = date.length === 4 ? `${date}-01-01` : date.length === 7 ? `${date}-01` : date;
  return `${full}T00:00:00Z`;
}
function rfc822(instant: string) {
  return new Date(instant).toUTCString();
}
const year = (date: string) => Number(date.slice(0, 4));

function lastTwelveMonths(now: Date) {
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

function githubEvidence(source: ThingSource & { kind: 'github' }, observation: GitHubObservation): Evidence[] {
  const scope = observation.activity.find((a) => (a.path ?? undefined) === source.path) ?? observation.activity[0];
  const evidence: Evidence[] = [];
  if (scope?.latestCommit)
    evidence.push({ date: scope.latestCommit.date, label: 'Latest commit', url: scope.latestCommit.url });
  if (observation.release)
    evidence.push({
      date: observation.release.date,
      label: `Release ${observation.release.name}`,
      url: observation.release.url
    });
  return evidence;
}
function webEvidence(observation: WebObservation): Evidence[] {
  const evidence: Evidence[] = [];
  if (observation.feed?.newestPublished)
    evidence.push({ date: observation.feed.newestPublished, label: 'Latest publication', url: observation.feed.url });
  if (observation.sitemap?.newestModified)
    evidence.push({
      date: observation.sitemap.newestModified,
      label: 'Latest page change',
      url: observation.sitemap.url
    });
  return evidence;
}
// Every month from `since` to `until`, with Tinylytics' counts and zero where it had none.
function viewMonths(observation: TinylyticsObservation): MonthCount[] {
  const counts = new Map(observation.months.map((m) => [m.month, m.count]));
  const months: MonthCount[] = [];
  const [year, month] = observation.since.slice(0, 7).split('-').map(Number);
  for (let i = 0; ; i++) {
    const key = new Date(Date.UTC(year, month - 1 + i, 1)).toISOString().slice(0, 7);
    if (key > observation.until.slice(0, 7) || i > 24) break;
    months.push({ month: key, count: counts.get(key) ?? 0 });
  }
  return months;
}
function siteScreenshot(observation: ScreenshotObservation): SiteScreenshot {
  const host = new URL(observation.url).host;
  const date = observation.observedAt.slice(0, 10);
  return {
    src: screenshotAsset(observation),
    site: observation.url,
    host,
    date,
    width: observation.width,
    height: observation.height,
    alt: `The front page of ${host} on ${formatDate(date)}`
  };
}
function sourceMonths(source: SiteSource): MonthCount[] {
  const observation = source.observation;
  if (!observation) return [];
  if (observation.kind === 'github') {
    const scope =
      observation.activity.find((a) => (a.path ?? undefined) === (source as { path?: string }).path) ??
      observation.activity[0];
    return scope?.months ?? [];
  }
  return observation.feed?.months ?? [];
}

function thingFilters(thing: Thing, sources: SiteSource[], topics: Map<string, Topic>): ThingFilter[] {
  const languages = new Set(
    sources.flatMap((source) =>
      source.observation?.kind === 'github' ? source.observation.languages.slice(0, 1).map((l) => l.name) : []
    )
  );
  return [
    { name: 'status', value: thing.status, label: statusLabels[thing.status] },
    { name: 'collection', value: facetSlug(thing.collection), label: thing.collection },
    ...thing.topics.flatMap((id) => {
      const topic = topics.get(id);
      return topic ? [{ name: 'topic' as const, value: topic.id, label: topic.title }] : [];
    }),
    ...(thing.started
      ? [{ name: 'year' as const, value: thing.started.slice(0, 4), label: thing.started.slice(0, 4) }]
      : []),
    ...[...languages].map((name) => ({ name: 'language' as const, value: facetSlug(name), label: name }))
  ];
}

export function buildSiteModel(registry: Registry, observations: Observation[], now = new Date()): SiteModel {
  const github = new Map<string, GitHubObservation>();
  const web = new Map<string, WebObservation>();
  const wayback = new Map<string, WaybackObservation>();
  const tinylytics = new Map<string, TinylyticsObservation>();
  const screenshots = new Map<string, ScreenshotObservation>();
  const commitLogs = new Map<string, CommitLogObservation>();
  const publicationLogs = new Map<string, PublicationsObservation>();
  for (const observation of observations)
    if (observation.kind === 'github') github.set(githubKey(observation.repository), observation);
    else if (observation.kind === 'web') web.set(websiteKey(observation.url), observation);
    else if (observation.kind === 'wayback') wayback.set(websiteKey(observation.url), observation);
    else if (observation.kind === 'tinylytics') {
      const origin = rootOrigin(observation.url);
      if (origin) tinylytics.set(siteKey(origin), observation);
    } else if (observation.kind === 'commits') commitLogs.set(githubKey(observation.repository), observation);
    else if (observation.kind === 'publications') publicationLogs.set(websiteKey(observation.url), observation);
    else screenshots.set(websiteKey(observation.url), observation);
  const activityThings = registry.things.map((thing) => ({
    id: thing.id,
    title: thing.title,
    page: `/things/${thing.id}/`,
    status: thing.status,
    sources: thing.sources
  }));
  const activity = buildActivity(activityThings, [...commitLogs.values()], [...publicationLogs.values()]);
  const topicById = new Map(registry.topics.map((topic) => [topic.id, topic]));
  const inbound = new Map<string, InboundConnection[]>();
  for (const thing of registry.things)
    for (const connection of thing.connections)
      inbound.set(connection.to, [...(inbound.get(connection.to) ?? []), { ...connection, from: thing.id }]);
  const window = lastTwelveMonths(now);

  const things: SiteThing[] = registry.things.map((thing) => {
    const sources: SiteSource[] = thing.sources.map((source) => {
      if (source.kind === 'github') {
        const observation = github.get(githubKey(source.repository)) ?? null;
        return { ...source, observation, evidence: observation ? githubEvidence(source, observation) : [] };
      }
      const observation = web.get(websiteKey(source.url)) ?? null;
      const captures = wayback.get(websiteKey(capturedUrl(source.url))) ?? null;
      // Page views and the front page belong to the thing whose website this is, never to a thing that
      // only links to it.
      const own = source.role === 'website';
      const origin = own ? rootOrigin(source.url) : null;
      const views = origin ? (tinylytics.get(siteKey(origin)) ?? null) : null;
      const screenshot = own ? (screenshots.get(websiteKey(source.url)) ?? null) : null;
      return {
        ...source,
        observation,
        captures,
        views,
        screenshot,
        evidence: observation ? webEvidence(observation) : []
      };
    });
    const shot = sources.find((source) => source.screenshot)?.screenshot;
    const viewed = sources.find((source) => source.views)?.views;
    const evidence = sources.flatMap((source) => source.evidence).sort((a, b) => b.date.localeCompare(a.date));
    // The commit and publication logs count every month of the sources that are the thing's activity; the
    // GitHub and feed observations count the rest (a successor's repository, a feed the thing only refers
    // to, a source with no log yet) over their shorter windows, as they always have.
    const counts = new Map(window.map((month) => [month, 0]));
    const logged = (source: ThingSource) =>
      countsAsActivity(source) &&
      (source.kind === 'github'
        ? commitLogs.has(githubKey(source.repository))
        : publicationLogs.has(websiteKey(source.url)));
    const fromLogs = activityMonths(
      activityThings.find((t) => t.id === thing.id)!,
      [...commitLogs.values()],
      [...publicationLogs.values()]
    );
    for (const { month, count } of [...fromLogs, ...sources.filter((s) => !logged(s)).flatMap(sourceMonths)])
      if (counts.has(month)) counts.set(month, (counts.get(month) ?? 0) + count);
    const events = registry.history.filter((event) => event.things.includes(thing.id));
    const eventYears = events.map((event) => year(event.date));
    const start = thing.started ? year(thing.started) : eventYears.length ? Math.min(...eventYears) : null;
    const end = thing.ended
      ? year(thing.ended)
      : thing.status === 'active' || thing.status === 'dormant'
        ? now.getUTCFullYear()
        : eventYears.length
          ? Math.max(...eventYears)
          : start;
    return {
      ...thing,
      page: `/things/${thing.id}/`,
      markdown: `/things/${thing.id}.md`,
      statusLabel: statusLabels[thing.status],
      statusDescription: statusDescriptions[thing.status],
      sticker: sticker(thing.id, thing.title),
      sources,
      events,
      inbound: inbound.get(thing.id) ?? [],
      topicList: thing.topics.flatMap((id) => {
        const topic = topicById.get(id);
        return topic ? [{ ...topic, page: `/topics/${topic.id}/` }] : [];
      }),
      latest: evidence[0] ?? null,
      months: window.map((month) => ({ month, count: counts.get(month) ?? 0 })),
      screenshot: shot ? siteScreenshot(shot) : null,
      artifacts: (thing.artifacts ?? []).map((artifact) => siteArtifact(thing.id, artifact, registry.artifactFiles)),
      views: viewed ? { site: viewed.url, total: viewed.hits, until: viewed.until, months: viewMonths(viewed) } : null,
      span: { start, end },
      filters: thingFilters(thing, sources, topicById),
      activity: activity.things.get(thing.id) ?? null
    };
  });
  const byId = new Map(things.map((thing) => [thing.id, thing]));
  const sortedThings = things.toSorted((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));

  const names = [...new Set(things.map((thing) => thing.collection))].toSorted((a, b) => {
    const [ia, ib] = [collectionOrder.indexOf(a), collectionOrder.indexOf(b)];
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });
  const collections = names.map((name) => ({ name, things: sortedThings.filter((t) => t.collection === name) }));
  const topics: SiteTopic[] = registry.topics.map((topic) => ({
    ...topic,
    page: `/topics/${topic.id}/`,
    things: sortedThings.filter((thing) => thing.topics.includes(topic.id))
  }));
  const years: SiteYear[] = [];
  for (const event of registry.history) {
    const y = event.date.slice(0, 4);
    const bucket = years.find((b) => b.year === y) ?? (years.push({ year: y, events: [] }), years.at(-1)!);
    bucket.events.push(event);
  }

  const dated = things.filter((thing) => thing.span.start !== null);
  const rows: TimelineRow[] = dated
    .map((thing) => ({
      thing,
      start: thing.span.start!,
      end: thing.span.end ?? thing.span.start!,
      events: thing.events.map((event) => ({ event, year: year(event.date) }))
    }))
    .sort((a, b) => a.start - b.start || a.thing.title.localeCompare(b.thing.title));
  const firstYear = rows.length ? Math.min(...rows.map((row) => row.start)) : now.getUTCFullYear();
  const lastYear = now.getUTCFullYear();
  const startedOn = (row: TimelineRow) => row.thing.started ?? String(row.start);
  const timelineYears: TimelineYear[] = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => {
    const y = lastYear - i;
    const alive = rows.filter((row) => row.start <= y && row.end >= y);
    return {
      year: y,
      alive: (Object.keys(statusLabels) as Status[])
        .map((status) => ({ status, count: alive.filter((row) => row.thing.status === status).length }))
        .filter((s) => s.count > 0),
      total: alive.length,
      started: rows
        .filter((row) => row.start === y)
        .toSorted((a, b) => startedOn(b).localeCompare(startedOn(a)) || a.thing.title.localeCompare(b.thing.title)),
      ended: rows.filter(
        (row) => row.end === y && row.start < y && row.thing.status !== 'active' && row.thing.status !== 'dormant'
      ),
      events: registry.history.filter((event) => year(event.date) === y).length
    };
  });
  const statuses = (Object.keys(statusLabels) as Status[]).map((status) => ({
    status,
    label: statusLabels[status],
    description: statusDescriptions[status],
    count: things.filter((thing) => thing.status === status).length
  }));
  const counted = (name: FacetName) => {
    const values = new Map<string, FacetValue>();
    for (const thing of things)
      for (const filter of thing.filters.filter((f) => f.name === name)) {
        const value = values.get(filter.value) ?? { value: filter.value, label: filter.label, count: 0 };
        values.set(filter.value, { ...value, count: value.count + 1 });
      }
    return values;
  };
  const byCount = (values: Map<string, FacetValue>) =>
    [...values.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const inOrder = (values: Map<string, FacetValue>, order: string[]) => order.flatMap((v) => values.get(v) ?? []);
  // Started is every year from the first to this one, empty years included, so it draws as a histogram.
  const started = counted('year');
  const first = Math.min(now.getUTCFullYear(), ...[...started.keys()].map(Number));
  const startYears = Array.from({ length: now.getUTCFullYear() - first + 1 }, (_, i) => String(first + i));
  const facet = (name: FacetName, label: string, values: FacetValue[]): Facet => ({
    name,
    label,
    values,
    most: Math.max(0, ...values.map((v) => v.count))
  });
  const facets = [
    facet('status', 'Status', inOrder(counted('status'), Object.keys(statusLabels))),
    facet(
      'year',
      'Started',
      startYears.map((y) => started.get(y) ?? { value: y, label: y, count: 0 })
    ),
    facet('topic', 'Topic', byCount(counted('topic'))),
    facet('collection', 'Collection', inOrder(counted('collection'), names.map(facetSlug))),
    facet('language', 'Written in', byCount(counted('language')))
  ];
  return {
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    repository: repositoryUrl,
    generated: now.toISOString(),
    things: sortedThings,
    featured: registry.featured.map((id) => byId.get(id)!),
    collections,
    topics,
    history: registry.history,
    years,
    timeline: {
      firstYear,
      lastYear,
      rows,
      years: timelineYears,
      mostAlive: Math.max(1, ...timelineYears.map((y) => y.total)),
      undated: sortedThings.filter((thing) => !byId.get(thing.id)?.span.start && thing.span.start === null)
    },
    statuses,
    facets,
    activity: activity.activity
  };
}

// The Markdown twin of a thing: the registry record as it is written, plus its canonical page.
export function thingMarkdown(thing: SiteThing) {
  const frontmatter: Record<string, unknown> = {
    id: thing.id,
    title: thing.title,
    summary: thing.summary,
    collection: thing.collection,
    status: thing.status,
    url: thing.url,
    ...(thing.started ? { started: thing.started } : {}),
    ...(thing.ended ? { ended: thing.ended } : {}),
    topics: thing.topics,
    sources: thing.sources.map(
      ({ observation: _o, captures: _c, views: _v, screenshot: _s, evidence: _e, ...source }) => source
    ),
    connections: thing.connections,
    ...(thing.story ? { story: thing.story } : {}),
    ...(thing.artifacts.length ? { artifacts: thing.artifacts.map(artifactRecord) } : {}),
    page: `${siteUrl}${thing.page}`
  };
  const yaml = stringify(frontmatter, { lineWidth: 0 }).trimEnd();
  const body = thing.body.trim();
  return `---\n${yaml}\n---\n\n# ${thing.title}\n\n${thing.summary}\n${body ? `\n${body}\n` : ''}`;
}

export function llmsText(model: SiteModel) {
  const lines = [
    `# ${model.title}`,
    '',
    `> ${model.description}`,
    '',
    `Every thing has a Markdown twin at /things/<id>.md. The whole registry with the latest observation for each source is ${model.url}/things.json. The history ledger is ${model.url}/feed.json. Status is a decision; activity is evidence.`,
    '',
    '## Things',
    '',
    ...model.things.map((thing) => `- [${thing.title}](${model.url}${thing.markdown}): ${thing.summary}`),
    '',
    '## Topics',
    '',
    ...model.topics.map((topic) => `- [${topic.title}](${model.url}${topic.page}): ${topic.description}`),
    '',
    '## Optional',
    '',
    `- [History](${model.url}/history/): every sourced event, newest first`,
    `- [Activity](${model.url}/activity/): the commits and publications that landed in each thing, week by week; ${model.url}/activity.xml has one item a day`,
    `- [Full text](${model.url}/llms-full.txt): every thing's record and story in one file`,
    ''
  ];
  return lines.join('\n');
}
export function llmsFullText(model: SiteModel) {
  return [`# ${model.title}\n\n${model.description}\n`, ...model.things.map(thingMarkdown)].join('\n---\n\n');
}

// The ingestion surface for Librarian: the registry plus the latest observation for every source.
export function thingsJson(model: SiteModel) {
  return {
    site: model.url,
    generated: model.generated,
    things: model.things.map((thing) => ({
      id: thing.id,
      title: thing.title,
      summary: thing.summary,
      collection: thing.collection,
      status: thing.status,
      url: thing.url,
      ...(thing.started ? { started: thing.started } : {}),
      ...(thing.ended ? { ended: thing.ended } : {}),
      page: `${model.url}${thing.page}`,
      markdown: `${model.url}${thing.markdown}`,
      topics: thing.topics,
      sources: thing.sources.map(({ evidence: _e, screenshot: _s, ...source }) => source),
      connections: thing.connections,
      ...(thing.screenshot
        ? {
            screenshot: {
              url: `${model.url}${thing.screenshot.src}`,
              site: thing.screenshot.site,
              date: thing.screenshot.date
            }
          }
        : {}),
      ...(thing.story ? { story: thing.story } : {}),
      ...(thing.artifacts.length
        ? {
            artifacts: thing.artifacts.map((artifact) => ({
              ...artifactRecord(artifact),
              kind: artifact.kind,
              bytes: artifact.bytes
            }))
          }
        : {}),
      body: thing.body.trim(),
      latest: thing.latest
    })),
    topics: model.topics.map(({ things, ...topic }) => ({ ...topic, things: things.map((t) => t.id) })),
    history: model.history
  };
}

// The ledger as a feed: what changed in what Jamie has built, newest first.
type FeedItem = {
  id: string;
  url: string;
  title: string;
  summary: string;
  html: string;
  date: string; // as written
  instant: string;
  things: { id: string; title: string; page: string }[];
  source: string;
};
function feedItems(model: SiteModel): FeedItem[] {
  const byId = new Map(model.things.map((thing) => [thing.id, thing]));
  return model.history.map((event) => {
    const things = event.things.flatMap((id) => {
      const thing = byId.get(id);
      return thing ? [{ id, title: thing.title, page: `${model.url}${thing.page}` }] : [];
    });
    const links = things.map((t) => `<a href="${t.page}">${escapeHtml(t.title)}</a>`).join(', ');
    return {
      id: event.id,
      url: `${model.url}/history/#${event.id}`,
      title: event.title,
      summary: event.summary,
      html: `<p>${escapeHtml(event.summary)}</p><p>${formatDate(event.date)} · ${event.kind} · ${links}</p><p><a href="${escapeHtml(event.source)}">Source</a></p>`,
      date: event.date,
      instant: toInstant(event.date),
      things,
      source: event.source
    };
  });
}
export function jsonFeed(model: SiteModel) {
  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: `${model.title} History`,
    home_page_url: `${model.url}/`,
    feed_url: `${model.url}/feed.json`,
    description: 'What changed in what I’ve built. Sourced events, newest first.',
    authors: [{ name: 'Jamie Thingelstad', url: 'https://www.thingelstad.com/' }],
    items: feedItems(model).map((item) => ({
      id: item.id,
      url: item.url,
      external_url: item.source,
      title: item.title,
      content_html: item.html,
      summary: item.summary,
      date_published: item.instant,
      tags: item.things.map((thing) => thing.title)
    }))
  };
}
function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
// RSS carries the newest events, enough for a reader to catch up; feed.json and /history/ carry them all.
export const rssItems = 30;
export function rssFeed(model: SiteModel) {
  const items = feedItems(model).slice(0, rssItems);
  const newest = items[0]?.instant ?? model.generated;
  const entries = items
    .map(
      (item) => `    <item>
      <title>${escapeHtml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="false">${escapeHtml(item.id)}</guid>
      <pubDate>${rfc822(item.instant)}</pubDate>
      <description>${escapeHtml(item.html)}</description>
${item.things.map((thing) => `      <category>${escapeHtml(thing.title)}</category>`).join('\n')}
    </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(model.title)} History</title>
    <link>${model.url}/</link>
    <atom:link href="${model.url}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>What changed in what I’ve built. Sourced events, newest first.</description>
    <language>en-us</language>
    <lastBuildDate>${rfc822(newest)}</lastBuildDate>
${entries}
  </channel>
</rss>
`;
}

// The activity feed: one item a day, for the newest complete days with something in them. It is kept apart
// from the history feed, which stays quiet: this one is evidence, collected every day.
const activityFeedPath = '/activity.xml';
function activityItem(model: SiteModel, day: ActivityDay) {
  const names = day.things.map((t) => t.title);
  const title = `${formatDate(day.day)}: ${
    names.length <= 3
      ? names.join(', ').replace(/, ([^,]*)$/, ' and $1')
      : `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`
  }`;
  const link = (url: string) => (url.startsWith('/') ? `${model.url}${url}` : url);
  const things = day.things
    .map((thing) => {
      const lines = [...thing.headlines, ...thing.published]
        .map((line) => `<li><a href="${escapeHtml(link(line.url))}">${escapeHtml(line.text)}</a></li>`)
        .join('');
      const more =
        thing.more > 0
          ? `<p>${thing.moreUrl ? `<a href="${escapeHtml(thing.moreUrl)}">` : ''}And ${thing.more} more ${thing.more === 1 ? 'commit' : 'commits'}${thing.moreUrl ? ' on GitHub</a>' : ''}.</p>`
          : '';
      return `<li><p><a href="${model.url}${thing.page}">${escapeHtml(thing.title)}</a>: ${escapeHtml(activitySummary(thing))}.</p>${lines ? `<ul>${lines}</ul>` : ''}${more}</li>`;
    })
    .join('');
  return {
    title,
    url: `${model.url}/activity/#${day.week}`,
    id: `activity-${day.day}`,
    instant: day.last,
    html: `<p>${escapeHtml(activitySummary(day))}.</p><ul>${things}</ul>`,
    things: day.things.map((t) => t.title)
  };
}
export function activityRss(model: SiteModel) {
  const items = model.activity.days.map((day) => activityItem(model, day));
  const newest = items[0]?.instant ?? model.generated;
  const entries = items
    .map(
      (item) => `    <item>
      <title>${escapeHtml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="false">${item.id}</guid>
      <pubDate>${rfc822(item.instant)}</pubDate>
      <description>${escapeHtml(item.html)}</description>
${item.things.map((thing) => `      <category>${escapeHtml(thing)}</category>`).join('\n')}
    </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(model.title)} Activity</title>
    <link>${model.url}/activity/</link>
    <atom:link href="${model.url}${activityFeedPath}" rel="self" type="application/rss+xml"/>
    <description>What landed in what I’ve built, one item a day: commits to each thing’s public repositories, with who made them, and what its feeds published.</description>
    <language>en-us</language>
    <lastBuildDate>${rfc822(newest)}</lastBuildDate>
${entries}
  </channel>
</rss>
`;
}

// A twelve-month sparkline of commits and publications. Evidence, never a verdict.
export function sparkline(months: MonthCount[], label: string, variant?: string) {
  const max = Math.max(1, ...months.map((m) => m.count));
  const width = 12 * 7;
  const height = 18;
  const bars = months
    .map(({ month, count }, i) => {
      const h = count ? Math.max(2, Math.round((count / max) * (height - 2))) : 1;
      return `<rect x="${i * 7}" y="${height - h}" width="5" height="${h}" rx="1.5" class="${count ? 'spark-on' : 'spark-off'}"><title>${month}: ${count}</title></rect>`;
    })
    .join('');
  return `<svg class="sparkline${variant ? ` sparkline-${variant}` : ''}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeHtml(label)}">${bars}</svg>`;
}

// The timeline reads down the page, newest year first. Each thing gets a small strip covering every
// year on the timeline: its span as a bar, its sourced events as dots. Both are plain SVG with titles.
export function lifespan(row: TimelineRow, timeline: Timeline) {
  const step = 4;
  const years = timeline.lastYear - timeline.firstYear + 1;
  const width = years * step;
  const height = 12;
  const x = (y: number) => (y - timeline.firstYear) * step;
  const thing = row.thing;
  const span =
    row.start === row.end
      ? `${row.start}`
      : `${row.start} to ${thing.status === 'active' || thing.status === 'dormant' ? 'now' : row.end}`;
  const dots = [...new Set(row.events.map((e) => e.year))]
    .map((ey) => `<circle cx="${x(ey) + step / 2}" cy="${height / 2}" r="1.6" class="ls-event"/>`)
    .join('');
  const label = `${thing.title}: ${span}, ${row.events.length} sourced ${row.events.length === 1 ? 'event' : 'events'}`;
  return `<svg class="lifespan" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeHtml(label)}"><title>${escapeHtml(label)}</title><rect x="0" y="${height / 2 - 1}" width="${width}" height="2" rx="1" class="ls-track"/><rect x="${x(row.start)}" y="2" width="${x(row.end) + step - x(row.start)}" height="${height - 4}" rx="3" class="ls-bar ls-${thing.status}"/>${dots}</svg>`;
}

// How many things were alive in a year, as one bar split by status, scaled to the busiest year.
export function aliveBar(year: TimelineYear, timeline: Timeline) {
  const width = 240;
  const height = 8;
  let x = 0;
  const parts = year.alive
    .map(({ status, count }) => {
      const w = (count / timeline.mostAlive) * width;
      const rect = `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${height}" class="ls-${status}"><title>${count} ${statusLabels[status].toLowerCase()}</title></rect>`;
      x += w;
      return rect;
    })
    .join('');
  const label = `${year.total} ${year.total === 1 ? 'thing' : 'things'} alive in ${year.year}`;
  return `<svg class="alive" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="${label}">${parts}</svg>`;
}
