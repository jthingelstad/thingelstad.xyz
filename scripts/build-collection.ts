// Regenerates src/data/collection.json and src/data/github.json from content/ and data/.
// Run before building the React site. The committed JSON must match; tests/registry.test.ts checks that.
import { writeFile } from 'node:fs/promises';
import { loadRegistry } from '../collection/load';
import { formatJson, loadObservations } from '../collection/observations';
import { toLegacyCollection, toLegacyGitHub } from '../collection/legacy';
import { validateCollection } from '../server/collection-validation';

const registry = await loadRegistry();
const observations = await loadObservations();
const collection = validateCollection(toLegacyCollection(registry));
await writeFile('src/data/collection.json', await formatJson(collection));
await writeFile('src/data/github.json', await formatJson(toLegacyGitHub(registry, observations)));
console.log(
  `Built ${registry.things.length} things, ${registry.topics.length} topics, ${registry.history.length} events, ${observations.length} observations.`
);
