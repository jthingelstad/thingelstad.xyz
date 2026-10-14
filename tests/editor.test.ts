import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { collection } from '../src/data/projects';
import { validateCollection } from '../server/collection-validation';
import { createCollectionStore, Conflict } from '../server/collection-store';
import { editorHostAllowed } from '../server/editor-edge';
import { createEditorHandler } from '../server/editor-handler';
import { importRepository } from '../server/github-import';
import { nodeMeasure, nodeRadius } from '../src/data/sources';
import type { GitHubData } from '../src/data/schema';

async function directory() {
  const path = await mkdtemp(join(tmpdir(), 'thingelstad-editor-'));
  await writeFile(join(path, 'collection.json'), JSON.stringify(collection));
  await writeFile(join(path, 'github.json'), JSON.stringify({ schemaVersion: 1, repositories: [] }));
  return path;
}
const now = new Date('2026-10-14T12:00:00Z');
const source = { id: 'github-example', kind: 'github' as const, repository: 'owner/example' };
const fakeCommit = (n = 1) => ({
  sha: n.toString(16).padStart(40, '0'),
  html_url: `https://github.com/owner/example/commit/${n.toString(16).padStart(40, '0')}`,
  commit: { committer: { date: '2026-10-13T12:00:00Z' } }
});
const fakeReader: NonNullable<Parameters<typeof importRepository>[2]> = async (endpoint) => {
  if (endpoint.endsWith('/languages')) return { TypeScript: 100, CSS: 20 };
  if (endpoint.includes('/releases'))
    return [
      { tag_name: 'draft', draft: true, prerelease: false, published_at: now.toISOString() },
      {
        tag_name: 'v1',
        draft: false,
        prerelease: false,
        published_at: now.toISOString(),
        html_url: 'https://github.com/owner/example/releases/tag/v1'
      }
    ];
  if (endpoint.includes('/commits'))
    return [fakeCommit(), ...(endpoint.includes('per_page=100') ? [fakeCommit()] : [])];
  return {
    full_name: 'owner/example',
    private: false,
    visibility: 'public',
    default_branch: 'main',
    created_at: '2020-01-01T00:00:00Z',
    html_url: 'https://github.com/owner/example',
    archived: false,
    description: 'An example.',
    secret_extra: 'never published'
  };
};

test('the collection preserves shared repositories and several repositories for one thing', () => {
  assert.equal(validateCollection(collection), collection);
  const clan = collection.things.find((t) => t.id === 'elixir-clan')!;
  const elixir = collection.things.find((t) => t.id === 'elixir')!;
  assert.ok(clan.sources.some((a) => elixir.sources.some((b) => a.sourceId === b.sourceId)));
  assert.equal(
    clan.sources.filter((a) => collection.sources.find((s) => s.id === a.sourceId)?.kind === 'github').length,
    2
  );
  assert.ok(collection.things.some((t) => t.id === 'nnxyz'));
  for (const edit of [
    (d: typeof collection) => {
      d.things[0].sources[0].sourceId = 'unknown';
    },
    (d: typeof collection) => {
      d.things[0].url = 'https://user:password@example.com';
    },
    (d: typeof collection) => {
      d.history[0].date = '2026-02-30';
    },
    (d: typeof collection) => {
      d.sources.push({ id: 'another', kind: 'github', repository: 'jthingelstad/nnxyz' });
    },
    (d: typeof collection) => {
      d.connections[0].to = d.connections[0].from;
    }
  ]) {
    const copy = structuredClone(collection);
    edit(copy);
    assert.throws(() => validateCollection(copy));
  }
});

test('atomic saves reject stale browser revisions and preserve external edits', async () => {
  const path = await directory();
  try {
    const store = createCollectionStore(path),
      before = await store.read();
    const first = structuredClone(before.collection),
      second = structuredClone(before.collection);
    first.things[0].summary = 'One draft.';
    second.things[0].summary = 'Another draft.';
    const results = await Promise.allSettled([store.save(first, before.revision), store.save(second, before.revision)]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(results.filter((r) => r.status === 'rejected' && r.reason instanceof Conflict).length, 1);
    const saved = await store.read();
    const external = structuredClone(saved.collection);
    external.things[0].summary = 'An outside edit.';
    await writeFile(join(path, 'collection.json'), JSON.stringify(external));
    await assert.rejects(store.save(first, saved.revision), Conflict);
    assert.equal((await store.read()).collection.things[0].summary, 'An outside edit.');
    await assert.rejects(store.save({}, (await store.read()).revision));
    assert.equal((await store.read()).collection.things[0].summary, 'An outside edit.');
  } finally {
    await rm(path, { recursive: true, force: true });
  }
});

test('GitHub import allows only public fields, deduplicates commits, and scopes attachments', async () => {
  const snapshot = await importRepository(source, [null, 'packages/clan', null], fakeReader, now);
  assert.equal(snapshot.activity.length, 2);
  assert.equal(snapshot.activity[0].count, 1);
  assert.equal(snapshot.activity[0].complete, true);
  assert.equal(snapshot.release?.name, 'v1');
  assert.doesNotMatch(JSON.stringify(snapshot), /secret_extra|never published|draft/);
  let calls = 0;
  await assert.rejects(
    importRepository(
      source,
      [null],
      async () => {
        calls++;
        return { private: true, visibility: 'private' };
      },
      now
    ),
    /Only public/
  );
  assert.equal(calls, 1);
  await assert.rejects(importRepository({ ...source, repository: 'owner/example?injected' }, [null], fakeReader, now));
  await assert.rejects(importRepository(source, ['../private'], fakeReader, now));
});

test('bounded GitHub activity reports a lower bound and stale evidence is unknown', async () => {
  const snapshot = await importRepository(
    source,
    [null],
    async (endpoint) =>
      endpoint.includes('per_page=100&page=')
        ? Array.from({ length: 100 }, (_, i) =>
            fakeCommit(Number(new URL(`https://api.github.com/${endpoint}`).searchParams.get('page')) * 100 + i)
          )
        : fakeReader(endpoint),
    now
  );
  assert.equal(snapshot.activity[0].count, 300);
  assert.equal(snapshot.activity[0].complete, false);
  const data = structuredClone(collection);
  data.things[0].sources = [{ sourceId: source.id, role: 'implementation' }];
  const evidence: GitHubData = { schemaVersion: 1, repositories: [snapshot] };
  assert.equal(nodeMeasure(data.things[0].id, 'activity', data, evidence, now), null);
  snapshot.activity[0].complete = true;
  assert.equal(nodeMeasure(data.things[0].id, 'activity', data, evidence, now), 300);
  assert.equal(nodeMeasure(data.things[0].id, 'activity', data, evidence, new Date('2026-11-01')), null);
  data.things[0].sources.push({ sourceId: source.id, role: 'theme' });
  assert.equal(nodeMeasure(data.things[0].id, 'activity', data, evidence, now), 300);
  assert.ok(nodeRadius(1e12, 'activity') <= 17);
  assert.equal(nodeRadius(null, 'history'), 8);
});

test('editor refuses foreign origins, missing session tokens, unsafe bodies, and stale saves', async () => {
  const path = await directory();
  let handler: ReturnType<typeof createEditorHandler>;
  const server = createServer((req, res) => {
    void handler(req, res);
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const port = (server.address() as { port: number }).port;
  const origin = `http://127.0.0.1:${port}`;
  let imports = 0;
  handler = createEditorHandler(path, new Set([origin]), async (s, paths) => {
    imports++;
    return importRepository(s, paths, fakeReader, now);
  });
  try {
    assert.equal((await fetch(`${origin}/api/editor`)).status, 403);
    assert.equal(
      (await fetch(`${origin}/api/editor`, { headers: { 'X-Editor-Request': '1', 'Sec-Fetch-Site': 'cross-site' } }))
        .status,
      403
    );
    const session = (await (await fetch(`${origin}/api/editor`, { headers: { 'X-Editor-Request': '1' } })).json()) as {
      revision: string;
      token: string;
      collection: typeof collection;
    };
    const headers = {
      'X-Editor-Request': '1',
      'X-Editor-Token': session.token,
      'Content-Type': 'application/json',
      Origin: origin
    };
    const save = (
      changes: Record<string, string>,
      body = { collection: session.collection, revision: session.revision }
    ) =>
      fetch(`${origin}/api/editor/save`, {
        method: 'POST',
        headers: { ...headers, ...changes },
        body: JSON.stringify(body)
      });
    assert.equal((await save({ Origin: 'https://attacker.example' })).status, 403);
    assert.equal((await save({ Origin: '' })).status, 403);
    assert.equal((await save({ 'X-Editor-Token': '' })).status, 403);
    assert.equal((await save({ 'Content-Type': 'text/plain' })).status, 415);
    const changed = structuredClone(session.collection);
    changed.things[0].summary = 'Saved safely.';
    assert.equal((await save({}, { collection: changed, revision: session.revision })).status, 200);
    assert.equal((await save({})).status, 409);
    const before = await readFile(join(path, 'collection.json'), 'utf8');
    assert.equal(
      (
        await fetch(`${origin}/api/editor/refresh`, {
          method: 'POST',
          headers: { ...headers, Origin: 'null' },
          body: JSON.stringify({ sourceId: 'github-nnxyz' })
        })
      ).status,
      403
    );
    assert.equal(imports, 0);
    assert.equal(
      (
        await fetch(`${origin}/api/editor/refresh`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ sourceId: 'github-nnxyz' })
        })
      ).status,
      200
    );
    assert.equal(imports, 1);
    assert.equal(await readFile(join(path, 'collection.json'), 'utf8'), before);
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
    await rm(path, { recursive: true, force: true });
  }
});

test('the editor host allowlist accepts only loopback and its configured tailnet origin', () => {
  const origins = new Set(['http://127.0.0.1:5174', 'https://otto.tail09aaf9.ts.net:10003']);
  assert.equal(editorHostAllowed('127.0.0.1:5174', origins), true);
  assert.equal(editorHostAllowed('otto.tail09aaf9.ts.net:10003', origins), true);
  assert.equal(editorHostAllowed('otto.tail09aaf9.ts.net', origins), true);
  for (const host of [undefined, 'attacker.example:5174', 'otto.tail09aaf9.ts.net:443', '127.0.0.1:9999'])
    assert.equal(editorHostAllowed(host, origins), false);
});
