import githubData from './github.json';
import { collection } from './projects';
import type { Collection, GitHubData, RepositorySnapshot } from './schema';

export const github = githubData as GitHubData;
const sourceById = new Map(collection.sources.map((source) => [source.id, source]));
const snapshotById = new Map(github.repositories.map((snapshot) => [snapshot.sourceId, snapshot]));
export function sourcesFor(id: string) {
  return (collection.things.find((thing) => thing.id === id)?.sources ?? []).map((attachment) => ({
    attachment,
    source: sourceById.get(attachment.sourceId)!,
    snapshot: snapshotById.get(attachment.sourceId)
  }));
}
export function observationFor(snapshot: RepositorySnapshot | undefined, path?: string) {
  return snapshot?.activity.find((observation) => observation.path === (path ?? null));
}
export type NodeSizing = 'equal' | 'history' | 'activity';
// Display scalars keep units separate: history is a documented span, activity is GitHub commits.
// Unknown or stale observations keep a base radius, rather than claiming zero activity.
export function nodeMeasure(
  id: string,
  sizing: NodeSizing,
  data: Collection = collection,
  evidence: GitHubData = github,
  now = new Date()
): number | null {
  if (sizing === 'equal') return 0;
  if (sizing === 'history') {
    const years = data.history
      .filter((event) => event.projectIds.includes(id))
      .map((event) => Number(event.date.slice(0, 4)));
    if (!years.length) return null;
    return Math.max(...years) - Math.min(...years);
  }
  const thing = data.things.find((item) => item.id === id);
  if (!thing) return null;
  let found = false;
  let count = 0;
  const seen = new Set<string>();
  for (const attachment of thing.sources) {
    if (!['implementation', 'theme'].includes(attachment.role)) continue;
    const snapshot = evidence.repositories.find((repo) => repo.sourceId === attachment.sourceId);
    if (!snapshot || now.valueOf() - Date.parse(snapshot.fetchedAt) > 14 * 86400000) continue;
    const observation = observationFor(snapshot, attachment.path);
    // Incomplete windows aren't comparable with complete windows. Overlapping directory
    // scopes can't be added without commit IDs, so use the broadest/count-largest scope once.
    if (!observation || !observation.complete || seen.has(snapshot.repository.toLowerCase())) continue;
    const others = thing.sources
      .filter((a) => a.sourceId === attachment.sourceId && ['implementation', 'theme'].includes(a.role))
      .map((a) => observationFor(snapshot, a.path))
      .filter((o) => o?.complete);
    seen.add(snapshot.repository.toLowerCase());
    found = true;
    count += Math.max(...others.map((o) => o!.count));
  }
  return found ? count : null;
}
export function nodeRadius(value: number | null, sizing: NodeSizing) {
  if (sizing === 'equal' || value === null) return 8;
  return 8 + Math.min(9, Math.log1p(Math.max(0, value)) * (sizing === 'history' ? 2.5 : 1.4));
}
