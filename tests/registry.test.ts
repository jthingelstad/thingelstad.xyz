import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadRegistry, splitFrontmatter } from '../collection/load';
import { loadObservations } from '../collection/observations';
import { toLegacyCollection, toLegacyGitHub } from '../collection/legacy';
import { checkReferences, thing, historyEvent, preciseDate } from '../collection/validate';
import { validateCollection } from '../server/collection-validation';

const registry = await loadRegistry();
const observations = await loadObservations();

test('the content tree is the source of truth for the committed site data', async () => {
  const collection = JSON.parse(await readFile('src/data/collection.json', 'utf8'));
  const github = JSON.parse(await readFile('src/data/github.json', 'utf8'));
  assert.deepEqual(toLegacyCollection(registry), collection, 'run `npm run collection:build` and commit the result');
  assert.deepEqual(
    toLegacyGitHub(registry, observations),
    github,
    'run `npm run collection:build` and commit the result'
  );
  validateCollection(toLegacyCollection(registry));
});

test('the registry has things, topics, sourced history, and no private material', () => {
  assert.ok(registry.things.length >= 50);
  assert.ok(registry.topics.length >= 10);
  assert.ok(registry.history.length >= 30);
  for (const event of registry.history) assert.match(event.source, /^https:\/\//);
  assert.doesNotMatch(JSON.stringify(registry), /\/Users\/|credential|localhost|127\.0\.0\.1|ts\.net/);
  const retired = registry.things.filter((t) => t.status === 'retired' || t.status === 'archived');
  assert.ok(retired.length > 0);
  assert.ok(registry.things.some((t) => t.id === 'things-ive-built'));
});

const base = {
  title: 'Example',
  summary: 'An example thing.',
  collection: 'Examples',
  status: 'active',
  url: 'https://example.com/',
  topics: [],
  sources: [{ kind: 'github', repository: 'owner/example', role: 'implementation' }],
  connections: []
};
test('thing front matter is validated strictly', () => {
  const ok = thing('example', base, '', 'things/example.md');
  assert.equal(ok.url, 'https://example.com/');
  assert.throws(() => thing('example', { ...base, status: 'finished' }, '', 'x'), /Status must be one of/);
  assert.throws(() => thing('example', { ...base, extra: true }, '', 'x'), /Unknown field: extra/);
  assert.throws(() => thing('example', { ...base, url: 'http://example.com/' }, '', 'x'), /public HTTPS/);
  assert.throws(() => thing('example', { ...base, url: 'https://otto.tail09aaf9.ts.net/' }, '', 'x'), /public HTTPS/);
  assert.throws(() => thing('example', base, 'See /Users/jamie/code', 'x'), /local path/);
  assert.throws(() => thing('Example', base, '', 'x'), /lowercase, hyphenated/);
  assert.throws(() => thing('example', { ...base, started: '2020-13' }, '', 'x'), /Invalid calendar date/);
  assert.throws(() => thing('example', { ...base, started: '2021', ended: '2020' }, '', 'x'), /cannot end before/);
  assert.throws(
    () =>
      thing(
        'example',
        { ...base, sources: [{ kind: 'website', url: 'https://example.com/', role: 'website', path: 'x' }] },
        '',
        'x'
      ),
    /website source has only/
  );
  assert.throws(
    () =>
      thing(
        'example',
        { ...base, connections: [{ to: 'example', label: 'is', detail: 'self', source: 'https://example.com/' }] },
        '',
        'x'
      ),
    /two different things/
  );
  assert.equal(preciseDate(2017, 'x'), '2017');
  assert.equal(preciseDate(new Date('2005-02-13T00:00:00Z'), 'x'), '2005-02-13');
});

test('references between files are checked after loading', () => {
  const a = thing('a', { ...base, topics: ['missing'] }, '', 'x');
  assert.throws(() => checkReferences({ things: [a], topics: [], history: [] }), /Unknown topic: missing/);
  const b = thing(
    'b',
    { ...base, connections: [{ to: 'c', label: 'uses', detail: 'd', source: 'https://example.com/' }] },
    '',
    'x'
  );
  assert.throws(() => checkReferences({ things: [b], topics: [], history: [] }), /Unknown thing: c/);
  const event = historyEvent(
    {
      id: 'e',
      date: '2026-10',
      kind: 'launch',
      title: 't',
      summary: 's',
      source: 'https://example.com/',
      things: ['nobody']
    },
    'x'
  );
  assert.throws(() => checkReferences({ things: [], topics: [], history: [event] }), /Unknown thing: nobody/);
  assert.throws(() => historyEvent({ ...event, things: [] }, 'x'), /at least one thing/);
});

test('front matter splitting keeps the Markdown body intact', () => {
  const { frontmatter, body } = splitFrontmatter('---\ntitle: T\n---\n\nBody with --- inside.\n', 'x');
  assert.deepEqual(frontmatter, { title: 'T' });
  assert.equal(body.trim(), 'Body with --- inside.');
  assert.throws(() => splitFrontmatter('title: T\n', 'x'), /front matter/);
});
