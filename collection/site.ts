// The model the static site is built from. Reads the registry and the observations and derives
// everything a page or an output needs, so templates stay thin. What is written out of it lives beside it:
// records.ts (Markdown twins, llms.txt, things.json), feeds.ts (RSS, JSON Feed), charts.ts (the small SVGs).
//
// Status is a decision; activity is evidence. The model keeps them apart: `status` comes from the
// registry only, and `latest` and `months` come from observations only.
import {
  githubKey,
  websiteKey,
  type Artifact,
  type ArtifactBundle,
  type ArtifactFile,
  type CommitLogObservation,
  type Connection,
  type GitHubObservation,
  type HistoryEvent,
  type Interview,
  type MonthCount,
  type Observation,
  type PublicationsObservation,
  type Registry,
  type ScreenshotObservation,
  type Status,
  type Storyline,
  type Thing,
  type ThingSource,
  type TinylyticsObservation,
  type Topic,
  type WaybackObservation,
  type WebObservation
} from './schema';
import { captureLink, capturedUrl } from './adapters/wayback';
import { artifactKind, formatBytes, isImage } from './artifacts';
import {
  imageJobs,
  keepsOriginal,
  picture,
  shareImage,
  type ImageJob,
  type ImageSource,
  type Picture,
  type ShareImage
} from './images';
import { rootOrigin, siteKey } from './adapters/tinylytics';
import { currentSite, withRef } from './sites';
import { parseTranscript, type Turn } from './interviews';
import { buildYearPages, type YearPage } from './years';
import { activityMonths, countsAsActivity, buildActivity, type Activity, type ThingRecord } from './activity';

export const siteUrl = 'https://thingelstad.xyz';
const siteTitle = 'Things I’ve built.';
const siteDescription =
  'Projects that Jamie Thingelstad has built: the ones he runs today and the ones he has stepped away from. Kept by Thingy, his sidekick.';
const repositoryUrl = 'https://github.com/jthingelstad/thingelstad.xyz';

const statusLabels: Record<Status, string> = {
  active: 'Active',
  dormant: 'Dormant',
  retired: 'Retired',
  abandoned: 'Abandoned',
  archived: 'Archived'
};
// The status words are Jamie's, from questions 3 and 28 of his interview (content/interviews/session-1.md and session-4.md):
// retired is no longer available, dormant is still available but not worked on, abandoned is a project he left,
// archived came to a natural conclusion. Status is his decision, and evidence never sets one.
const statusDescriptions: Record<Status, string> = {
  active: 'Jamie is building or running it.',
  dormant: 'Still available, but Jamie is not working on it right now. It may come back.',
  retired: 'No longer available. Jamie ended it on purpose.',
  abandoned: 'Jamie left it before it worked out.',
  archived: 'Finished. It came to a natural conclusion and is kept as it is.'
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
  screenshot?: ScreenshotObservation | null; // its own website source: its page, captured monthly; or the capture an
  // archive source pins in the Internet Archive, shot once
  evidence: Evidence[];
};
// The thing's own page (a site's front page, or the page inside a site where the thing lives) as it looked on
// the day it was captured. The JPEG is published under /assets/ with its hash in the name, so a new capture is a
// new file and the old one stays for open pages. Pages show it through `picture`, smaller copies of it
// (collection/images.ts); `src` is the capture itself.
// A thing whose site is gone shows the capture its record pins in the Internet Archive instead (`wayback`): the
// date is the day the Archive captured it, and the picture links to that capture.
type SiteScreenshot = {
  src: string;
  picture: Picture;
  share: ShareImage;
  site: string; // the page it shows: the URL that was captured, or the page the Archive kept
  href: string; // where the picture links: the page itself, or its capture in the Archive
  wayback: string | null; // the capture in the Archive, for a picture of one
  place: string; // the host, with the path for a page inside a site: rwbookclub.com/oliver; the host for the Archive
  page: string; // what was captured: "the front page", or "this page" for a page inside a site
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
// that shows it, which is the file itself or its preview (null for a file with neither). Its anchor is its
// address on the page (#artifact-<file>), named by its file, which never changes, so a link to it stays good.
export type SiteArtifact = Artifact & {
  anchor: string;
  src: string;
  kind: string;
  bytes: number;
  size: string;
  image: { src: string; width: number; height: number; picture: Picture | null } | null; // picture: null for a GIF
};
// A thing's face: the one picture that stands for it where a page is shared (og:image). The artifact its record
// names as its `face`, when it names one: a choice made by hand wins. Otherwise its captured front page
// when it has one; else the first of its artifact images, in their listed order, that reads well as a wide share
// card: a landscape image near the card's shape with room for 1200 pixels first, then any landscape image at least
// 600 wide. Failing both, the largest small landscape image, so a little logo never wins over a bigger picture; and
// a thing with only portrait images (phone screens) shows its first. Null for a thing with neither.
export type Face = ShareImage & { from: 'screenshot' | 'artifact'; file?: string };
const faceRank = ({ width, height }: { width: number; height: number }) => {
  const aspect = width / height;
  if (aspect >= 1.2 && aspect <= 2.4 && width >= 1000) return 0;
  if (aspect >= 1 && width >= 600) return 1;
  if (aspect >= 1) return 2;
  return 3;
};
export function faceOf(
  screenshot: SiteScreenshot | null,
  artifacts: (SiteArtifact & { face: ShareImage | null })[],
  chosen?: string
): Face | null {
  const named = chosen === undefined ? undefined : artifacts.find((artifact) => artifact.file === chosen);
  if (named?.face) return { ...named.face, from: 'artifact', file: named.file };
  if (screenshot) return { ...screenshot.share, from: 'screenshot' };
  const shown = artifacts.filter((artifact) => artifact.image);
  const best = Math.min(...shown.map((artifact) => faceRank(artifact.image!)));
  const area = (artifact: SiteArtifact) => artifact.image!.width * artifact.image!.height;
  const ranked = shown.filter((artifact) => faceRank(artifact.image!) === best);
  const pick = best === 2 ? ranked.toSorted((a, b) => area(b) - area(a))[0] : ranked[0];
  return pick ? { ...pick.face!, from: 'artifact', file: pick.file } : null;
}
const artifactPath = (id: string, file: string) => `/things/${id}/artifacts/${file}`;
type MeasuredArtifact = SiteArtifact & { face: ShareImage | null }; // the share image it would make, if picked
function siteArtifact(id: string, artifact: Artifact, files: Map<string, ArtifactFile> | undefined): MeasuredArtifact {
  const measured = (file: string) => {
    const found = files?.get(`${id}/${file}`);
    if (!found) throw new Error(`The artifact ${id}/${file} was not measured; load the registry with loadRegistry.`);
    return found;
  };
  const { bytes } = measured(artifact.file);
  const shown = isImage(artifact.file) ? artifact.file : artifact.preview;
  const image = shown ? measured(shown) : null;
  const source: ImageSource | null =
    shown && image
      ? { path: `content/artifacts/${id}/${shown}`, sha256: image.sha256!, width: image.width!, height: image.height! }
      : null;
  return {
    ...artifact,
    anchor: `artifact-${artifact.file}`,
    src: artifactPath(id, artifact.file),
    kind: artifactKind(artifact.file),
    bytes,
    size: formatBytes(bytes),
    image:
      shown && source
        ? {
            src: artifactPath(id, shown),
            width: source.width,
            height: source.height,
            picture: keepsOriginal(shown) ? null : picture(source)
          }
        : null,
    face: source ? shareImage(source, artifact.title) : null
  };
}
// A bundle as its page shows it, with its artifacts in their listed order.
// A bundle's shelf is as wide as its pictures want: narrow for phone screenshots, wider for the rest.
export type SiteBundle = ArtifactBundle & { artifacts: SiteArtifact[]; cardWidth: number };
const bundleCardWidth = (artifacts: SiteArtifact[]) => {
  const image = artifacts.find((artifact) => artifact.image)?.image;
  return image && image.height > image.width * 1.3 ? 186 : 300;
};
// A thing with this many artifacts also gets a page of them. The shelves on its own page keep every piece, so an
// address like #artifact-<file> holds either way. The page is not at /things/<id>/artifacts/: every file there goes
// out as an artifact, HTML as bytes to download (scripts/publish-plan.mjs), so an old project's page never runs here.
const artifactPageAt = 20;
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

export type SiteThing = Omit<Thing, 'sources' | 'bundles' | 'artifacts' | 'pull' | 'face'> & {
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
  bundles: SiteBundle[]; // empty when its artifacts are not in bundles
  artifactsPage: string | null; // the page of them, for a large set
  pull: { n: number; words: string; session: number; page: string } | null;
  face: Face | null; // what a share of its page shows
  views: SiteViews | null;
  span: { start: number | null; end: number | null }; // years, for the timeline
  filters: ThingFilter[]; // its facet values, for /search/
  activity: ThingRecord | null; // its commits and publications over its life, from the logs
  stories: StoryLink[]; // the stories it is part of
  interviews: InterviewLink[]; // the interviews with a question about it, and which questions
};
type StoryLink = { id: string; title: string; page: string };
type InterviewLink = { id: string; title: string; page: string; questions: number[] };
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
// A topic is a filter on /things/, and this is its address. /topics/<id>/ redirects here (infra/viewer-request.mjs).
const topicPage = (id: string) => `/things/?topic=${id}`;
type SiteTopic = Topic & { page: string; things: SiteThing[] };
// A story with its things in the order it tells them, the events of those things oldest first (a story reads
// forward), and its span: as written, or else from its things. It is still going while any of them is.
type SiteStoryline = Storyline & {
  page: string;
  cast: SiteThing[];
  events: HistoryEvent[];
  span: { started: string | null; ended: string | null; ongoing: boolean };
  latest: string | null; // the newest event date among its things: what orders the stories
};
// An interview session with its questions read from the transcript and resolved to things, and the things it is
// about in the order they first come up.
export type SiteInterview = Omit<Interview, 'questions'> & {
  page: string;
  markdown: string;
  name: string; // "Session 6: The loose ends"
  cast: SiteThing[];
  questions: { n: number; title: string; question: string; turns: Turn[]; things: SiteThing[] }[];
  previous?: { page: string; name: string; session: number; title: string };
  next?: { page: string; name: string; session: number; title: string };
};
type SiteCollection = { name: string; things: SiteThing[] };
export type TimelineRow = {
  thing: SiteThing;
  start: number;
  end: number;
  events: { event: HistoryEvent; year: number }[];
};
export type Timeline = {
  firstYear: number;
  lastYear: number;
  rows: TimelineRow[];
  undated: SiteThing[];
};
// A card on the front page's featured shelf, in the order of content/featured.yaml. Its links to the thing's
// own site carry ?ref=xyz-featured when Tinylytics counts that site, so the site's Sources report shows what
// the shelf sends it (Jamie, 2026-10-24: "add ref tags for these links so they can be measured"). A site
// Tinylytics does not count, a GitHub repository say, keeps its address as the record has it.
type SiteFeature = {
  thing: SiteThing;
  href: string | null; // the thing's own address
  cover: string | null; // where the cover leads: the captured site, or the thing's address
};

// A line on /all/, the list of everything live that the sites strip's All Things opens: an active thing with a
// website of its own (a source whose role is website), linked straight to that site. The link carries ?ref=xyz-all
// where Tinylytics counts the site, as the featured shelf does; a link to this site stays clean.
type SiteLive = { thing: SiteThing; href: string; host: string };

// A thing's artifacts on /artifacts/: how many, and a few to show. The picks take turns across its bundles, so a
// shelf shows the range of what was kept, and leave out a file with no image to show.
const picksShown = 8;
const bundleWords = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
type ArtifactSet = { thing: SiteThing; count: number; note: string; picks: SiteArtifact[] };
function artifactSet(thing: SiteThing): ArtifactSet {
  const shown = thing.artifacts.filter((artifact) => artifact.image);
  const groups = thing.bundles.length
    ? thing.bundles.map((bundle) => bundle.artifacts.filter((artifact) => artifact.image))
    : [shown];
  const longest = Math.max(0, ...groups.map((group) => group.length));
  const turns = Array.from({ length: longest }, (_, i) => groups.flatMap((group) => group[i] ?? []));
  const bundles = thing.bundles.length;
  return {
    thing,
    count: thing.artifacts.length,
    note:
      bundles > 1
        ? `${thing.artifacts.length}, in ${bundleWords[bundles] ?? bundles} bundles`
        : `${thing.artifacts.length}`,
    picks: turns.flat().slice(0, picksShown)
  };
}

export type SiteModel = {
  url: string;
  title: string;
  description: string;
  repository: string;
  generated: string;
  things: SiteThing[];
  screenshot: SiteScreenshot | null;
  face: Face | null; // what a share of a page that is no thing's own shows: this site's front page
  images: ImageJob[]; // every copy of a picture the pages use, for the build to make
  featured: SiteFeature[];
  live: { name: string; things: SiteLive[] }[]; // /all/, by collection in the collections' order
  collections: SiteCollection[];
  topics: SiteTopic[];
  stories: SiteStoryline[];
  interviews: SiteInterview[];
  stillToAsk: SiteThing[];
  words: { n: number; words: string; session: number; page: string }[]; // the front page's In his words
  lately: { event: HistoryEvent; things: SiteThing[] }[]; // the newest events
  artifactPages: SiteThing[];
  interviewIndex: { thing: SiteThing; sessions: { session: number; n: number; page: string }[] }[];
  history: HistoryEvent[];
  timeline: Timeline;
  years: YearPage[]; // newest first
  artifactSets: ArtifactSet[]; // the things with artifacts, most first
  artifactTotal: number;
  thingFilters: Facet[]; // the filters of /things/
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
// Feeds need an instant. A coarse date becomes the start of its period, at noon UTC: that keeps its
// calendar day from UTC-11 to UTC+11, where midnight UTC showed a Central reader the day before.
export function toInstant(date: string) {
  const full = date.length === 4 ? `${date}-01-01` : date.length === 7 ? `${date}-01` : date;
  return `${full}T12:00:00Z`;
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
  const archived = observation.wayback ?? null;
  const site = archived?.original ?? observation.url;
  const { hostname, host, pathname } = new URL(site);
  const date = archived
    ? `${archived.timestamp.slice(0, 4)}-${archived.timestamp.slice(4, 6)}-${archived.timestamp.slice(6, 8)}`
    : observation.observedAt.slice(0, 10);
  const root = archived ? pathname === '/' : rootOrigin(site) !== null;
  const place = archived ? hostname : root ? host : `${host}${pathname.replace(/\/$/, '')}`;
  const wayback = archived ? captureLink(archived.timestamp, archived.original) : null;
  const alt = archived
    ? `${root ? 'The front page of' : 'A page of'} ${place} as the Internet Archive captured it on ${formatDate(date)}`
    : `${root ? 'The front page of' : 'The page'} ${place} on ${formatDate(date)}`;
  const source: ImageSource = {
    path: `data/observations/screenshot/${observation.image}`,
    sha256: observation.sha256,
    width: observation.width,
    height: observation.height
  };
  return {
    src: screenshotAsset(observation),
    picture: picture(source),
    share: shareImage(source, alt),
    site,
    href: wayback ?? site,
    wayback,
    place,
    page: root ? 'the front page' : 'this page',
    date,
    width: observation.width,
    height: observation.height,
    alt
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
      const pinned = source.photograph === true;
      const shot = own || pinned ? (screenshots.get(websiteKey(source.url)) ?? null) : null;
      const screenshot = shot && !!shot.wayback === pinned ? shot : null;
      return {
        ...source,
        observation,
        captures,
        views,
        screenshot,
        evidence: observation ? webEvidence(observation) : []
      };
    });
    // A live screenshot always wins over a capture from the Archive.
    const shot = (
      sources.find((source) => source.screenshot && !source.screenshot.wayback) ??
      sources.find((source) => source.screenshot)
    )?.screenshot;
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
    const measured = (thing.artifacts ?? []).map((artifact) =>
      siteArtifact(thing.id, artifact, registry.artifactFiles)
    );
    const artifacts: SiteArtifact[] = measured.map(({ face: _face, ...artifact }) => artifact);
    const screenshot = shot ? siteScreenshot(shot) : null;
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
        return topic ? [{ ...topic, page: topicPage(topic.id) }] : [];
      }),
      latest: evidence[0] ?? null,
      months: window.map((month) => ({ month, count: counts.get(month) ?? 0 })),
      screenshot,
      face: faceOf(screenshot, measured, thing.face),
      artifacts,
      bundles: (thing.bundles ?? []).map((bundle) => ({
        ...bundle,
        artifacts: artifacts.filter((artifact) => artifact.bundle === bundle.id),
        cardWidth: bundleCardWidth(artifacts.filter((artifact) => artifact.bundle === bundle.id))
      })),
      views: viewed ? { site: viewed.url, total: viewed.hits, until: viewed.until, months: viewMonths(viewed) } : null,
      span: { start, end },
      filters: thingFilters(thing, sources, topicById),
      activity: activity.things.get(thing.id) ?? null,
      stories: registry.stories
        .filter((story) => story.things.includes(thing.id))
        .map((story) => ({ id: story.id, title: story.title, page: `/stories/${story.id}/` })),
      artifactsPage: (thing.artifacts?.length ?? 0) >= artifactPageAt ? `/things/${thing.id}/all-artifacts/` : null,
      pull: (() => {
        const line = thing.pull;
        if (!line) return null;
        const item = registry.interviews.find((session) => session.questions.some((q) => q.n === line.n));
        if (!item) throw new Error(`things/${thing.id}.pull: there is no question ${line.n}.`);
        return { ...line, session: item.session, page: `/interviews/${item.id}/#q${line.n}` };
      })(),
      interviews: registry.interviews.flatMap((item) => {
        const questions = item.questions.filter((q) => q.things.includes(thing.id)).map((q) => q.n);
        return questions.length
          ? [{ id: item.id, title: `Session ${item.session}`, page: `/interviews/${item.id}/`, questions }]
          : [];
      })
    };
  });
  const byId = new Map(things.map((thing) => [thing.id, thing]));
  const countedLink = (url: string, placement: string) => {
    const { hostname, origin } = new URL(url);
    const counted = tinylytics.has(siteKey(origin)) && hostname !== new URL(siteUrl).hostname;
    return counted ? withRef(url, `${currentSite}-${placement}`) : url;
  };
  const featuredLink = (url: string | null) => (url ? countedLink(url, 'featured') : null);
  const sortedThings = things.toSorted((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));

  const names = [...new Set(things.map((thing) => thing.collection))].toSorted((a, b) => {
    const [ia, ib] = [collectionOrder.indexOf(a), collectionOrder.indexOf(b)];
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });
  const collections = names.map((name) => ({ name, things: sortedThings.filter((t) => t.collection === name) }));
  const topics: SiteTopic[] = registry.topics.map((topic) => ({
    ...topic,
    page: topicPage(topic.id),
    things: sortedThings.filter((thing) => thing.topics.includes(topic.id))
  }));
  const stories: SiteStoryline[] = registry.stories
    .map((story) => {
      const cast = story.things.map((id) => byId.get(id)!);
      const events = registry.history
        .filter((event) => event.things.some((id) => story.things.includes(id)))
        .toSorted((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
      const starts = cast.map((t) => t.started).filter((d): d is string => !!d);
      const ongoing = !story.ended && cast.some((t) => t.status === 'active' || t.status === 'dormant');
      const ends = cast.map((t) => t.ended).filter((d): d is string => !!d);
      return {
        ...story,
        page: `/stories/${story.id}/`,
        cast,
        events,
        span: {
          started: story.started ?? (starts.length ? starts.toSorted()[0] : null),
          ended: story.ended ?? (ongoing || !ends.length ? null : ends.toSorted().at(-1)!),
          ongoing
        },
        latest: events.at(-1)?.date ?? null
      };
    })
    .toSorted((a, b) => (b.latest ?? '').localeCompare(a.latest ?? '') || a.title.localeCompare(b.title));
  const sessions = registry.interviews.toSorted((a, b) => a.session - b.session);
  const neighbor = (item?: Interview) =>
    item && {
      page: `/interviews/${item.id}/`,
      name: `Session ${item.session}: ${item.title}`,
      session: item.session,
      title: item.title
    };
  // Newest session first.
  const interviews: SiteInterview[] = sessions
    .map((item, position) => {
      const transcript = new Map(parseTranscript(item.body).map((q) => [q.n, q]));
      const questions = item.questions
        .toSorted((a, b) => a.n - b.n)
        .map((q) => ({
          n: q.n,
          title: q.title,
          question: transcript.get(q.n)!.question,
          turns: transcript.get(q.n)!.turns,
          things: q.things.map((id) => byId.get(id)!)
        }));
      const cast = [...new Set(questions.flatMap((q) => q.things))];
      return {
        ...item,
        page: `/interviews/${item.id}/`,
        markdown: `/interviews/${item.id}.md`,
        name: `Session ${item.session}: ${item.title}`,
        cast,
        questions,
        previous: neighbor(sessions[position - 1]),
        next: neighbor(sessions[position + 1])
      };
    })
    .toReversed();
  // The things no question has been about yet. It is computed, so the list shrinks as sessions are added.
  const asked = new Set(interviews.flatMap((item) => item.cast.map((thing) => thing.id)));
  const stillToAsk = things.filter((thing) => !asked.has(thing.id));
  // The index by thing on /interviews/: each thing a question has been about, and for each session its first question.
  const interviewIndex = things
    .filter((thing) => asked.has(thing.id))
    .map((thing) => ({
      thing,
      sessions: interviews
        .filter((item) => item.cast.some((c) => c.id === thing.id))
        .map((item) => {
          const q = item.questions.find((question) => question.things.some((t) => t.id === thing.id))!;
          return { session: item.session, n: q.n, page: `${item.page}#q${q.n}` };
        })
        .toReversed()
    }))
    .toSorted((a, b) => a.thing.title.localeCompare(b.thing.title));
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
  const facetOf = (name: FacetName, label: string) => ({ ...facets.find((f) => f.name === name)!, label });
  const timeline: Timeline = {
    firstYear,
    lastYear,
    rows,
    undated: sortedThings.filter((thing) => thing.span.start === null)
  };
  const artifactSets = sortedThings
    .filter((thing) => thing.artifacts.length)
    .map(artifactSet)
    .toSorted((a, b) => b.count - a.count || a.thing.title.localeCompare(b.thing.title));
  return {
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    repository: repositoryUrl,
    generated: now.toISOString(),
    things: sortedThings,
    // The share image for a page that isn't a thing's own: this site's front page, as its thing has it.
    screenshot: things.find((thing) => thing.url === `${siteUrl}/`)?.screenshot ?? null,
    face: things.find((thing) => thing.url === `${siteUrl}/`)?.face ?? null,
    images: imageJobs(
      things.flatMap((thing) => [
        ...(thing.screenshot ? [thing.screenshot.picture] : []),
        ...thing.artifacts.flatMap((artifact) => (artifact.image?.picture ? [artifact.image.picture] : [])),
        ...(thing.face ? [thing.face] : [])
      ])
    ),
    featured: registry.featured.map((id) => {
      const thing = byId.get(id)!;
      return { thing, href: featuredLink(thing.url), cover: featuredLink(thing.screenshot?.href ?? thing.url) };
    }),
    live: collections
      .map(({ name, things: members }) => ({
        name,
        things: members
          .filter(
            (thing) =>
              thing.status === 'active' && thing.url && thing.sources.some((source) => source.role === 'website')
          )
          .map((thing) => ({
            thing,
            href: countedLink(thing.url!, 'all'),
            host: new URL(thing.url!).hostname.replace(/^www\./, '') + new URL(thing.url!).pathname.replace(/\/$/, '')
          }))
      }))
      .filter((group) => group.things.length),
    collections,
    topics,
    stories,
    interviews,
    stillToAsk,
    interviewIndex,
    words: interviews.flatMap((item) =>
      [item.pull, ...item.also].map((line) => ({
        ...line,
        session: item.session,
        page: `${item.page}#q${line.n}`
      }))
    ),
    lately: registry.history
      .toSorted((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10)
      .map((event) => ({ event, things: event.things.map((id) => byId.get(id)!) })),
    artifactPages: things.filter((thing) => thing.artifactsPage),
    history: registry.history,
    timeline,
    years: buildYearPages(timeline, registry.history, activity.activity),
    artifactSets,
    artifactTotal: artifactSets.reduce((sum, set) => sum + set.count, 0),
    thingFilters: [facetOf('status', 'Status'), facetOf('collection', 'Kind'), facetOf('topic', 'Topic')],
    statuses,
    facets,
    activity: activity.activity
  };
}
