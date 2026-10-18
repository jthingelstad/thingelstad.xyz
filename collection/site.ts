// The model the static site is built from. Reads the registry and the observations and derives
// everything a page, a feed, llms.txt, or things.json needs, so templates stay thin.
//
// Status is a decision; activity is evidence. The model keeps them apart: `status` comes from the
// registry only, and `latest` and `months` come from observations only.
import { stringify } from 'yaml';
import {
  githubKey,
  websiteKey,
  type Connection,
  type GitHubObservation,
  type HistoryEvent,
  type MonthCount,
  type Observation,
  type Registry,
  type Status,
  type Thing,
  type ThingSource,
  type Topic,
  type WaybackObservation,
  type WebObservation
} from './schema';
import { capturedUrl } from './adapters/wayback';

export const siteUrl = 'https://thingelstad.xyz';
const siteTitle = 'Things I’ve built.';
const siteDescription =
  'An index and archive of Jamie Thingelstad’s projects, including the ones he has stepped away from.';
const repositoryUrl = 'https://github.com/jthingelstad/thingelstad.xyz';

const statusLabels: Record<Status, string> = {
  active: 'Active',
  dormant: 'Dormant',
  retired: 'Retired',
  archived: 'Archived'
};
const statusDescriptions: Record<Status, string> = {
  active: 'Being built or operated.',
  dormant: 'Not currently worked on, and may return.',
  retired: 'Deliberately ended.',
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
  evidence: Evidence[];
};
type InboundConnection = Connection & { from: string };
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

export type SiteThing = Omit<Thing, 'sources'> & {
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
  span: { start: number | null; end: number | null }; // years, for the timeline
};
type SiteTopic = Topic & { page: string; things: SiteThing[] };
type SiteCollection = { name: string; things: SiteThing[] };
type SiteYear = { year: string; events: HistoryEvent[] };
type TimelineRow = {
  thing: SiteThing;
  start: number;
  end: number;
  events: { event: HistoryEvent; year: number }[];
};
export type Timeline = { firstYear: number; lastYear: number; rows: TimelineRow[]; undated: SiteThing[] };
export type SiteModel = {
  url: string;
  title: string;
  description: string;
  repository: string;
  generated: string;
  things: SiteThing[];
  collections: SiteCollection[];
  topics: SiteTopic[];
  history: HistoryEvent[];
  years: SiteYear[];
  timeline: Timeline;
  statuses: { status: Status; label: string; description: string; count: number }[];
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

export function buildSiteModel(registry: Registry, observations: Observation[], now = new Date()): SiteModel {
  const github = new Map<string, GitHubObservation>();
  const web = new Map<string, WebObservation>();
  const wayback = new Map<string, WaybackObservation>();
  for (const observation of observations)
    if (observation.kind === 'github') github.set(githubKey(observation.repository), observation);
    else if (observation.kind === 'web') web.set(websiteKey(observation.url), observation);
    else if (observation.kind === 'wayback') wayback.set(websiteKey(observation.url), observation);
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
      return { ...source, observation, captures, evidence: observation ? webEvidence(observation) : [] };
    });
    const evidence = sources.flatMap((source) => source.evidence).sort((a, b) => b.date.localeCompare(a.date));
    const counts = new Map(window.map((month) => [month, 0]));
    for (const source of sources)
      for (const { month, count } of sourceMonths(source))
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
      span: { start, end }
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
  const statuses = (Object.keys(statusLabels) as Status[]).map((status) => ({
    status,
    label: statusLabels[status],
    description: statusDescriptions[status],
    count: things.filter((thing) => thing.status === status).length
  }));
  return {
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    repository: repositoryUrl,
    generated: now.toISOString(),
    things: sortedThings,
    collections,
    topics,
    history: registry.history,
    years,
    timeline: {
      firstYear,
      lastYear: now.getUTCFullYear(),
      rows,
      undated: sortedThings.filter((thing) => !byId.get(thing.id)?.span.start && thing.span.start === null)
    },
    statuses
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
    sources: thing.sources.map(({ observation: _o, captures: _c, evidence: _e, ...source }) => source),
    connections: thing.connections,
    ...(thing.story ? { story: thing.story } : {}),
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
      sources: thing.sources.map(({ evidence: _e, ...source }) => source),
      connections: thing.connections,
      ...(thing.story ? { story: thing.story } : {}),
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
    description: 'What changed in what Jamie Thingelstad has built. Sourced events, newest first.',
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
export function rssFeed(model: SiteModel) {
  const items = feedItems(model);
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
    <description>What changed in what Jamie Thingelstad has built. Sourced events, newest first.</description>
    <language>en-us</language>
    <lastBuildDate>${rfc822(newest)}</lastBuildDate>
${entries}
  </channel>
</rss>
`;
}

// A twelve-month sparkline of commits and publications. Evidence, never a verdict.
export function sparkline(months: MonthCount[], label: string) {
  const max = Math.max(1, ...months.map((m) => m.count));
  const width = 12 * 7;
  const height = 18;
  const bars = months
    .map(({ month, count }, i) => {
      const h = count ? Math.max(2, Math.round((count / max) * (height - 2))) : 1;
      return `<rect x="${i * 7}" y="${height - h}" width="5" height="${h}" rx="1.5" class="${count ? 'spark-on' : 'spark-off'}"><title>${month}: ${count}</title></rect>`;
    })
    .join('');
  return `<svg class="sparkline" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeHtml(label)}">${bars}</svg>`;
}

// The timeline is server-rendered SVG. One row per dated thing; a bar from its first to last year,
// dots for its sourced events. A small script adds hover and focus detail; without it, titles work.
export function timelineSvg(timeline: Timeline) {
  const left = 220;
  const right = 24;
  const columnWidth = 32;
  const rowHeight = 24;
  const top = 28;
  const years = timeline.lastYear - timeline.firstYear + 1;
  const width = left + years * columnWidth + right;
  const height = top + timeline.rows.length * rowHeight + 12;
  const x = (y: number) => left + (y - timeline.firstYear) * columnWidth;
  const grid = Array.from({ length: years }, (_, i) => timeline.firstYear + i)
    .map(
      (y) =>
        `<line x1="${x(y)}" y1="${top - 6}" x2="${x(y)}" y2="${height - 8}" class="tl-grid"/>` +
        (years <= 14 || y % 2 === 0 ? `<text x="${x(y) + 2}" y="${top - 12}" class="tl-year">${y}</text>` : '')
    )
    .join('');
  const rows = timeline.rows
    .map((row, i) => {
      const y = top + i * rowHeight;
      const thing = row.thing;
      const x1 = x(row.start);
      const x2 = x(row.end) + columnWidth - 6;
      const label = escapeHtml(thing.title);
      const span =
        row.start === row.end
          ? `${thing.started ? formatDate(thing.started) : row.start}`
          : `${thing.started ? formatDate(thing.started) : row.start} to ${thing.ended ? formatDate(thing.ended) : thing.status === 'active' || thing.status === 'dormant' ? 'now' : row.end}`;
      const tip = `${thing.title} · ${thing.statusLabel} · ${span}`;
      const dots = row.events
        .map(
          ({ event, year: ey }) =>
            `<circle cx="${x(ey) + columnWidth / 2}" cy="${y + rowHeight / 2}" r="3.5" class="tl-event tl-${event.kind}" data-tip="${escapeHtml(`${formatDate(event.date)} · ${event.title}`)}" tabindex="0" role="img" aria-label="${escapeHtml(`${formatDate(event.date)}: ${event.title}`)}"><title>${escapeHtml(`${formatDate(event.date)} · ${event.title}`)}</title></circle>`
        )
        .join('');
      return `<g class="tl-row" data-tip="${escapeHtml(tip)}">
  <a href="${thing.page}" class="tl-label"><text x="${left - 10}" y="${y + rowHeight / 2 + 4}" text-anchor="end">${label}</text></a>
  <rect x="${x1}" y="${y + 6}" width="${Math.max(10, x2 - x1)}" height="${rowHeight - 12}" rx="5" class="tl-bar tl-${thing.status}"><title>${escapeHtml(tip)}</title></rect>
  ${dots}
</g>`;
    })
    .join('\n');
  return `<svg class="timeline" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="group" aria-label="Timeline of things by year">
${grid}
${rows}
</svg>`;
}
