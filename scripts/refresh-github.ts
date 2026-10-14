import { resolve } from 'node:path';
import { createCollectionStore } from '../server/collection-store';
import { importRepository } from '../server/github-import';

const store = createCollectionStore(resolve('src/data'));
const initial = await store.read();
const only = process.argv[2];
const sources = initial.collection.sources.filter((s) => s.kind === 'github' && (!only || s.id === only));
if (!sources.length) throw new Error('No matching GitHub source.');
let failures = 0;
for (const source of sources) {
  if (source.kind !== 'github') continue;
  const paths = initial.collection.things.flatMap((t) =>
    t.sources.filter((a) => a.sourceId === source.id).map((a) => a.path ?? null)
  );
  if (!paths.length) continue;
  try {
    const snapshot = await importRepository(source, paths);
    if ((await store.read()).revision !== initial.revision) throw new Error('Collection changed; restart the refresh.');
    const data = await store.readGitHub();
    data.repositories = [...data.repositories.filter((r) => r.sourceId !== source.id), snapshot];
    await store.saveGitHub(data, initial.revision);
    console.log(`Refreshed ${source.repository}`);
  } catch {
    failures++;
    console.error(`Could not refresh ${source.repository}; previous evidence kept.`);
  }
}
if (failures) process.exitCode = 1;
