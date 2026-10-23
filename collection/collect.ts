// The collector: reads the registry, observes every source, and writes an observation only when the
// evidence changed. Observation time stamps alone never cause a write, so a weekly run with nothing
// new produces no diff.
import { loadRegistry } from './load';
import { loadObservations, observationPath, saveObservation, saveScreenshot } from './observations';
import { defaultCapturer, observeScreenshot, screenshotDue, type Capturer } from './adapters/screenshot';
import { defaultGitHubReader, observeRepository, type GitHubReader } from './adapters/github';
import { defaultTextFetcher, observePublications, observeWebsite, type TextFetcher } from './adapters/web';
import { defaultGitRunner, observeCommits, type GitRunner } from './adapters/git';
import { capturedUrl, observeCaptures } from './adapters/wayback';
import {
  defaultTinylyticsReader,
  listSites,
  observeSite,
  rootOrigin,
  siteKey,
  type TinylyticsReader
} from './adapters/tinylytics';
import {
  websiteKey,
  type Observation,
  type PublicationsObservation,
  type Registry,
  type ScreenshotObservation,
  type Status
} from './schema';
import { siteUrl } from './site';

export type CollectOptions = {
  registry?: Registry;
  existing?: Observation[];
  only?: string; // a repository name, a website URL, 'commits', 'publications', 'tinylytics', 'wayback', or 'screenshots'
  wayback?: TextFetcher | null; // null skips the Internet Archive
  pause?: (ms: number) => Promise<void>; // between Wayback requests: the CDX API rate-limits
  github?: GitHubReader;
  git?: GitRunner | null; // null skips the commit logs; the default runs the git command line
  web?: TextFetcher;
  tinylytics?: TinylyticsReader | null; // null skips Tinylytics; the default needs TINYLYTICS_API_KEY
  screenshots?: Capturer | null; // null skips screenshots; the default needs Playwright's Chromium
  now?: Date;
  save?: (observation: Observation) => Promise<string>;
  saveScreenshot?: (observation: ScreenshotObservation, image: Uint8Array) => Promise<string>;
  log?: (line: string) => void;
};
export type CollectResult = { written: string[]; unchanged: string[]; failed: { target: string; error: string }[] };

// Two observations are the same evidence when everything but the observation window matches.
export function sameEvidence(a: Observation, b: Observation) {
  const strip = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(strip);
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => !['observedAt', 'since', 'until'].includes(key))
          .map(([key, item]) => [key, strip(item)])
      );
    return value;
  };
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}
// Sites, not the posts that mention them: a reference post's first capture only repeats its date.
const capturedRoles = new Set(['website', 'archive', 'demo']);
// A thing's own feeds are its publications. A feed it only refers to is someone else's, and this site's own
// feed is the history ledger, which is already a page here.
const publishedRoles = new Set(['website', 'podcast']);
// Screenshots are of front pages that are still the thing's own. A retired or abandoned thing's host may
// belong to someone else by now, so it keeps whatever capture it already has.
const photographed = new Set<Status>(['active', 'dormant', 'archived']);
export function targets(registry: Registry) {
  const repositories = new Map<string, Set<string | null>>();
  const websites = new Map<string, { url: string; sitemap?: string; feed?: string }>();
  for (const thing of registry.things)
    for (const source of thing.sources) {
      if (source.kind === 'github') {
        const key = source.repository.toLowerCase();
        repositories.set(key, new Set([...(repositories.get(key) ?? []), source.path ?? null]));
        repositories.get(key)!.add(null);
      } else if (source.sitemap || source.feed) {
        const current = websites.get(source.url) ?? { url: source.url };
        websites.set(source.url, {
          url: source.url,
          ...(current.sitemap || source.sitemap ? { sitemap: current.sitemap ?? source.sitemap } : {}),
          ...(current.feed || source.feed ? { feed: current.feed ?? source.feed } : {})
        });
      }
    }
  const repositoryNames = new Map<string, string>();
  for (const thing of registry.things)
    for (const source of thing.sources)
      if (source.kind === 'github') repositoryNames.set(source.repository.toLowerCase(), source.repository);
  return {
    repositories: [...repositories].map(([key, paths]) => ({
      repository: repositoryNames.get(key)!,
      paths: [...paths].toSorted((a, b) => (a ?? '').localeCompare(b ?? ''))
    })),
    websites: [...websites.values()],
    feeds: [
      ...new Map(
        registry.things.flatMap((thing) =>
          thing.sources.flatMap((source) =>
            source.kind === 'website' &&
            source.feed &&
            publishedRoles.has(source.role) &&
            new URL(source.feed).origin !== siteUrl
              ? [[source.url, { url: source.url, feed: source.feed }] as const]
              : []
          )
        )
      ).values()
    ],
    captured: [
      ...new Set(
        registry.things.flatMap((thing) =>
          thing.sources.flatMap((source) =>
            source.kind === 'website' && capturedRoles.has(source.role) ? [capturedUrl(source.url)] : []
          )
        )
      )
    ].toSorted(),
    screenshots: [
      ...new Set(
        registry.things
          .filter((thing) => photographed.has(thing.status))
          .flatMap((thing) =>
            thing.sources.flatMap((source) =>
              source.kind === 'website' && source.role === 'website' && rootOrigin(source.url) ? [source.url] : []
            )
          )
      )
    ].toSorted(),
    origins: [
      ...new Set(
        registry.things.flatMap((thing) =>
          thing.sources.flatMap((source) => {
            const origin = source.kind === 'website' ? rootOrigin(source.url) : null;
            return origin ? [siteKey(origin)] : [];
          })
        )
      )
    ].toSorted()
  };
}
export async function collect(options: CollectOptions = {}): Promise<CollectResult> {
  const registry = options.registry ?? (await loadRegistry());
  const existing = options.existing ?? (await loadObservations());
  const github = options.github ?? defaultGitHubReader();
  // A feed is read once a run, for its counts and for its items.
  const fetched = new Map<string, Promise<string>>();
  const fetchText = options.web ?? defaultTextFetcher();
  const web: TextFetcher = (url) => {
    if (!fetched.has(url)) fetched.set(url, fetchText(url));
    return fetched.get(url)!;
  };
  const save = options.save ?? saveObservation;
  const log = options.log ?? console.log;
  const now = options.now ?? new Date();
  const result: CollectResult = { written: [], unchanged: [], failed: [] };
  const previous = new Map(existing.map((o) => [observationPath(o), o]));
  const record = async (target: string, observe: () => Promise<Observation>) => {
    try {
      const observation = await observe();
      const path = observationPath(observation);
      const before = previous.get(path);
      if (before && sameEvidence(before, observation)) {
        result.unchanged.push(target);
        log(`Unchanged ${target}`);
      } else {
        await save(observation);
        result.written.push(target);
        log(`Observed ${target}`);
      }
    } catch (error) {
      result.failed.push({ target, error: error instanceof Error ? error.message : String(error) });
      log(`Could not observe ${target}; previous evidence kept.`);
    }
  };
  const { repositories, websites, feeds, origins, captured, screenshots } = targets(registry);
  for (const { repository, paths } of repositories)
    if (!options.only || options.only.toLowerCase() === repository.toLowerCase())
      await record(repository, () => observeRepository(repository, paths, github, now));
  const git = options.git === undefined ? defaultGitRunner() : options.git;
  if (git)
    for (const { repository, paths } of repositories)
      if (!options.only || options.only === 'commits' || options.only.toLowerCase() === repository.toLowerCase())
        await record(`commits ${repository}`, () => observeCommits(repository, paths, git, github, now));
  for (const website of websites)
    if (!options.only || options.only === website.url)
      await record(website.url, () => observeWebsite(website, web, now));
  const logs = new Map(
    existing.flatMap((o) => (o.kind === 'publications' ? [[o.url, o] as [string, PublicationsObservation]] : []))
  );
  for (const source of feeds)
    if (!options.only || options.only === 'publications' || options.only === source.url)
      await record(`publications ${source.url}`, () => observePublications(source, web, logs.get(source.url), now));
  if (options.wayback !== null && (!options.only || options.only === 'wayback')) {
    const fetchText = options.wayback ?? web;
    const pause = options.pause ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
    for (const url of captured) {
      const target = `wayback ${url}`;
      await record(target, () => observeCaptures(url, fetchText, now));
      // A 429, or a refused connection once it has blocked the address, means stop asking for this run.
      if (result.failed.some((f) => f.target === target && /^429 |fetch failed/.test(f.error))) {
        log('The Internet Archive asked the collector to slow down; the remaining captures wait for the next run.');
        break;
      }
      await pause(6000);
    }
  }
  if (!options.only || options.only === 'tinylytics') {
    const tinylytics = options.tinylytics === undefined ? defaultTinylyticsReader() : options.tinylytics;
    if (!tinylytics) log('No TINYLYTICS_API_KEY; Tinylytics skipped.');
    else {
      const sites = await listSites(tinylytics).catch((error: unknown) => {
        result.failed.push({ target: 'tinylytics', error: error instanceof Error ? error.message : String(error) });
        log('Could not list Tinylytics sites; previous evidence kept.');
        return [];
      });
      for (const site of sites) {
        const origin = rootOrigin(site.url);
        if (origin && origins.includes(siteKey(origin)))
          await record(`${origin}/`, () => observeSite(site, tinylytics, now));
      }
    }
  }
  if (options.screenshots !== null && (!options.only || options.only === 'screenshots')) {
    const capturer = options.screenshots ?? (await defaultCapturer());
    const saveImage = options.saveScreenshot ?? saveScreenshot;
    const shots = new Map(existing.flatMap((o) => (o.kind === 'screenshot' ? [[websiteKey(o.url), o] as const] : [])));
    if (!capturer) log('Chromium is not installed; screenshots skipped.');
    else
      try {
        for (const url of screenshots) {
          const target = `screenshot ${url}`;
          const before = shots.get(websiteKey(url));
          if (!screenshotDue(before, now)) {
            result.unchanged.push(target);
            log(`Recent ${target}`);
            continue;
          }
          try {
            const { observation, image } = await observeScreenshot(url, capturer, now);
            if (before?.sha256 === observation.sha256) {
              result.unchanged.push(target);
              log(`Unchanged ${target}`);
            } else {
              await saveImage(observation, image);
              result.written.push(target);
              log(`Observed ${target}`);
            }
          } catch (error) {
            result.failed.push({ target, error: error instanceof Error ? error.message : String(error) });
            log(`Could not observe ${target}; previous evidence kept.`);
          }
        }
      } finally {
        await capturer.close();
      }
  }
  return result;
}
