// Bridge from the content tree to the schemaVersion 1 documents the current React site reads.
// This exists only until the static generator replaces the React application. It is one way:
// content/ and data/ are the source of truth, and src/data/*.json are build outputs.
import type { Collection, GitHubData, Source as LegacySource, Thing as LegacyThing } from '../src/data/schema';
import { githubKey, websiteKey, type Observation, type Registry, type Thing } from './schema';

const legacySourceId = (source: Thing['sources'][number]) =>
  source.kind === 'github' ? `github-${githubKey(source.repository)}` : `website-${websiteKey(source.url)}`;
const isHistorical = (thing: Thing) => thing.status === 'retired' || thing.status === 'archived';

export function toLegacyCollection(registry: Registry): Collection {
  const sources = new Map<string, LegacySource>();
  for (const thing of registry.things)
    for (const source of thing.sources) {
      const id = legacySourceId(source);
      if (sources.has(id)) continue;
      sources.set(
        id,
        source.kind === 'github'
          ? { id, kind: 'github', repository: source.repository }
          : { id, kind: 'website', url: source.url, ...(source.sitemap ? { sitemap: source.sitemap } : {}) }
      );
    }
  const things: LegacyThing[] = registry.things.map((thing) => ({
    id: thing.id,
    title: thing.title,
    summary: thing.summary,
    collection: thing.collection,
    url: thing.url,
    historical: isHistorical(thing),
    ...(thing.story ? { story: { ...thing.story, idea: thing.body } } : {}),
    sources: thing.sources.map((source) => ({
      sourceId: legacySourceId(source),
      role: source.role,
      ...(source.kind === 'github' && source.path ? { path: source.path } : {})
    }))
  }));
  return {
    schemaVersion: 1,
    things,
    sources: [...sources.values()],
    connections: registry.things.flatMap((thing) => thing.connections.map((edge) => ({ from: thing.id, ...edge }))),
    topics: registry.topics.map((topic) => ({
      ...topic,
      projectIds: registry.things.filter((thing) => thing.topics.includes(topic.id)).map((thing) => thing.id)
    })),
    history: registry.history.map(({ things: projectIds, ...event }) => ({
      id: event.id,
      projectIds,
      date: event.date,
      kind: event.kind,
      title: event.title,
      summary: event.summary,
      source: event.source
    }))
  };
}
export function toLegacyGitHub(registry: Registry, observations: Observation[]): GitHubData {
  const attached = new Set(
    registry.things.flatMap((t) => t.sources.filter((s) => s.kind === 'github').map((s) => legacySourceId(s)))
  );
  return {
    schemaVersion: 1,
    repositories: observations
      .flatMap((observation) => (observation.kind === 'github' ? [observation] : []))
      .filter((observation) => attached.has(`github-${githubKey(observation.repository)}`))
      .map(({ kind: _kind, observedAt, repository, ...rest }) => ({
        sourceId: `github-${githubKey(repository)}`,
        repository,
        fetchedAt: observedAt,
        ...rest
      }))
  };
}
