// The collector: reads the registry, observes every source, and writes an observation only when the
// evidence changed. Observation time stamps alone never cause a write, so a weekly run with nothing
// new produces no diff.
import { loadRegistry } from './load';
import { loadObservations, observationPath, saveObservation } from './observations';
import { defaultGitHubReader, observeRepository, type GitHubReader } from './adapters/github';
import { defaultTextFetcher, observeWebsite, type TextFetcher } from './adapters/web';
import {
  defaultTinylyticsReader,
  listSites,
  observeSite,
  rootOrigin,
  siteKey,
  type TinylyticsReader
} from './adapters/tinylytics';
import type { Observation, Registry } from './schema';

export type CollectOptions = {
  registry?: Registry;
  existing?: Observation[];
  only?: string; // a repository name, a website URL, or 'tinylytics'
  github?: GitHubReader;
  web?: TextFetcher;
  tinylytics?: TinylyticsReader | null; // null skips Tinylytics; the default needs TINYLYTICS_API_KEY
  now?: Date;
  save?: (observation: Observation) => Promise<string>;
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
  const web = options.web ?? defaultTextFetcher();
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
  const { repositories, websites, origins } = targets(registry);
  for (const { repository, paths } of repositories)
    if (!options.only || options.only.toLowerCase() === repository.toLowerCase())
      await record(repository, () => observeRepository(repository, paths, github, now));
  for (const website of websites)
    if (!options.only || options.only === website.url)
      await record(website.url, () => observeWebsite(website, web, now));
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
  return result;
}
