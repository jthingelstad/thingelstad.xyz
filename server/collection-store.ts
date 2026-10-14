import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { format } from 'prettier';
import { validateCollection } from './collection-validation';
import type { GitHubData } from '../src/data/schema';

export class Conflict extends Error {}
const revisionOf = (content: string) => createHash('sha256').update(content).digest('hex');

// The temp file is on the same filesystem. A failed write never replaces the collection.
async function atomicJson(path: string, value: unknown, beforeCommit?: () => Promise<void>) {
  const content = await format(JSON.stringify(value), { parser: 'json', printWidth: 120, tabWidth: 2 });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, content, { flag: 'wx' });
    await beforeCommit?.();
    await rename(temporary, path);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}
export function createCollectionStore(directory: string) {
  const path = join(directory, 'collection.json');
  let pending: Promise<unknown> = Promise.resolve();
  const serialize = <T>(action: () => Promise<T>): Promise<T> => {
    const result = pending.then(action, action);
    pending = result.catch(() => {});
    return result;
  };
  async function read() {
    const content = await readFile(path, 'utf8');
    return { collection: validateCollection(JSON.parse(content)), revision: revisionOf(content) };
  }
  return {
    read,
    save: (value: unknown, revision: string) =>
      serialize(async () => {
        const collection = validateCollection(value);
        if ((await read()).revision !== revision)
          throw new Conflict('The collection changed. Reload before saving; your draft has been kept.');
        await atomicJson(path, collection, async () => {
          if ((await read()).revision !== revision)
            throw new Conflict('The collection changed. Reload before saving; your draft has been kept.');
        });
        return read();
      }),
    readGitHub: async () => JSON.parse(await readFile(join(directory, 'github.json'), 'utf8')) as GitHubData,
    saveGitHub: (data: GitHubData, revision: string) =>
      serialize(async () => {
        if ((await read()).revision !== revision)
          throw new Conflict('The collection changed during the refresh. Try again.');
        await atomicJson(join(directory, 'github.json'), data, async () => {
          if ((await read()).revision !== revision)
            throw new Conflict('The collection changed during the refresh. Try again.');
        });
      })
  };
}
