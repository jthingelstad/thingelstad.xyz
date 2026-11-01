import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { artifactKind, formatBytes, imageSize } from '../collection/artifacts';
import { loadRegistry, measureArtifacts, splitFrontmatter } from '../collection/load';
import type { ScreenshotObservation } from '../collection/schema';
import {
  checkReferences,
  featuredEntry,
  featuredMax,
  thing,
  historyEvent,
  interview,
  preciseDate,
  storyline
} from '../collection/validate';

const registry = await loadRegistry();

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
  assert.throws(
    () => checkReferences({ things: [a], topics: [], history: [], featured: [], stories: [], interviews: [] }),
    /Unknown topic: missing/
  );
  const b = thing(
    'b',
    { ...base, connections: [{ to: 'c', label: 'uses', detail: 'd', source: 'https://example.com/' }] },
    '',
    'x'
  );
  assert.throws(
    () => checkReferences({ things: [b], topics: [], history: [], featured: [], stories: [], interviews: [] }),
    /Unknown thing: c/
  );
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
  assert.throws(
    () => checkReferences({ things: [], topics: [], history: [event], featured: [], stories: [], interviews: [] }),
    /Unknown thing: nobody/
  );
  assert.throws(() => historyEvent({ ...event, things: [] }, 'x'), /at least one thing/);
});

test('the featured shelf names a few active things, once each', () => {
  assert.ok(registry.featured.length > 0 && registry.featured.length <= featuredMax);
  for (const id of registry.featured)
    assert.equal(registry.things.find((t) => t.id === id)?.status, 'active', `${id} is featured`);
  assert.equal(featuredEntry({ thing: 'example' }, 'x'), 'example');
  assert.throws(() => featuredEntry({ thing: 'example', note: 'hi' }, 'x'), /Unknown field: note/);
  assert.throws(() => featuredEntry('example', 'x'), /Expected/);
  const things = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => thing(id, base, '', 'x'));
  const check = (featured: string[], list = things) =>
    checkReferences({ things: list, topics: [], history: [], featured, stories: [], interviews: [] });
  assert.deepEqual(check(['b', 'a']).featured, ['b', 'a'], 'the shelf keeps the file’s order');
  assert.throws(() => check(['a', 'a']), /Duplicate: a/);
  assert.throws(() => check(['nobody']), /Unknown thing: nobody/);
  assert.throws(() => check(['a', 'b', 'c', 'd', 'e', 'f', 'g']), /at most 6/);
  const retired = thing('old', { ...base, status: 'retired', ended: '2020' }, '', 'x');
  assert.throws(() => check(['old'], [...things, retired]), /Only active things are featured; old is not/);
});

test('a story runs through at least two known things, in its order, with a body', () => {
  const base = { title: 'T', summary: 'S', collection: 'C', status: 'active', url: null };
  const things = ['a', 'b', 'c'].map((id) => thing(id, base, '', 'x'));
  const front = { title: 'Two runs', summary: 'A then B.', things: ['b', 'a'], started: '2005-02-13' };
  const story = storyline('two-runs', front, 'The story.', 'stories/two-runs.md');
  assert.deepEqual(story.things, ['b', 'a'], 'the order is the story’s');
  assert.equal(story.started, '2005-02-13');
  assert.equal(story.ended, undefined);
  const check = (stories = [story], list = things) =>
    checkReferences({ things: list, topics: [], history: [], featured: [], stories, interviews: [] });
  assert.equal(check().stories.length, 1);
  assert.throws(() => check([story], things.slice(1)), /Unknown thing: a/);
  assert.throws(() => check([story, story]), /Duplicate: two-runs/);
  assert.throws(() => storyline('one', { ...front, things: ['a'] }, 'x', 'w'), /at least two things/);
  assert.throws(() => storyline('dup', { ...front, things: ['a', 'a'] }, 'x', 'w'), /Duplicate: a/);
  assert.throws(() => storyline('empty', front, '  ', 'w'), /public text/);
  assert.throws(() => storyline('extra', { ...front, color: 'red' }, 'x', 'w'), /Unknown field: color/);
  assert.throws(() => storyline('when', { ...front, ended: 'someday' }, 'x', 'w'), /YYYY/);
});

test('an interview is a transcript with numbered questions, each named question about known things', () => {
  const base = { title: 'T', summary: 'S', collection: 'C', status: 'active', url: null };
  const things = ['a', 'b'].map((id) => thing(id, base, '', 'x'));
  const front = {
    title: 'Jamie on a and b',
    summary: 'Two questions.',
    started: '2026-10-31',
    ended: '2026-11-01',
    notes: ['Filler words removed.'],
    questions: [{ n: 2, things: ['b', 'a'] }]
  };
  const body = '## Session 1\n\n### 1. Why a?\n\n**Jamie:** Because.\n\n### 2. Why b?\n\n**Jamie:** Also because.\n';
  const item = interview('jamie-october-2026', front, body, 'interviews/jamie-october-2026.md');
  assert.deepEqual(item.questions, [{ n: 2, things: ['b', 'a'] }]);
  assert.equal(item.started, '2026-10-31');
  const check = (interviews = [item], list = things) =>
    checkReferences({ things: list, topics: [], history: [], featured: [], stories: [], interviews });
  assert.equal(check().interviews.length, 1);
  assert.throws(() => check([item], things.slice(1)), /Unknown thing: a/);
  assert.throws(() => check([item, item]), /Duplicate: jamie-october-2026/);
  const make = (changes: Record<string, unknown>, text = body) => interview('i', { ...front, ...changes }, text, 'w');
  assert.throws(() => make({ questions: [{ n: 3, things: ['a'] }] }), /no "### 3\. " heading/);
  assert.throws(() => make({ questions: [{ n: 1, things: [] }] }), /at least one thing/);
  assert.throws(() => make({ questions: [{ n: 1, things: ['a', 'a'] }] }), /Duplicate: a/);
  assert.throws(
    () =>
      make({
        questions: [
          { n: 1, things: ['a'] },
          { n: 1, things: ['b'] }
        ]
      }),
    /Duplicate: 1/
  );
  assert.throws(() => make({ questions: [{ n: 'one', things: ['a'] }] }), /question number/);
  assert.throws(() => make({ questions: [{ n: 1, things: ['a'], why: 'x' }] }), /Unknown field: why/);
  assert.throws(() => make({}, 'No headings at all.'), /at least one "### N\. " question/);
  assert.throws(() => make({}, `${body}\n### 2. Again?\n`), /Duplicate: 2/);
  assert.throws(() => make({ ended: '2026-10-30' }), /cannot end before/);
  assert.throws(() => make({ color: 'red' }), /Unknown field: color/);
  assert.throws(() => make({ started: 'someday' }), /YYYY/);
});

test('front matter splitting keeps the Markdown body intact', () => {
  const { frontmatter, body } = splitFrontmatter('---\ntitle: T\n---\n\nBody with --- inside.\n', 'x');
  assert.deepEqual(frontmatter, { title: 'T' });
  assert.equal(body.trim(), 'Body with --- inside.');
  assert.throws(() => splitFrontmatter('title: T\n', 'x'), /front matter/);
});

test('artifacts are any kind of file, named plainly, with a preview only where a browser cannot show one', () => {
  const withArtifacts = (artifacts: unknown) => thing('example', { ...base, artifacts }, '', 'x');
  const ok = withArtifacts([
    { file: 'logo.png', title: 'The logo', date: '2009-05' },
    { file: 'design.ai', title: 'The design', preview: 'design.png', source: 'https://example.com/post' },
    { file: 'source.tar.gz', title: 'The source', caption: 'As it was.' }
  ]);
  assert.equal(ok.artifacts?.length, 3);
  assert.equal(ok.artifacts?.[1].preview, 'design.png');
  assert.equal(thing('example', base, '', 'x').artifacts, undefined, 'a thing with none has no list');
  assert.equal(thing('example', { ...base, artifacts: [] }, '', 'x').artifacts, undefined);
  for (const file of ['Logo.png', 'logo', 'images/logo.png', '../logo.png', 'logo .png', '.hidden.png', 'logo.png?x'])
    assert.throws(() => withArtifacts([{ file, title: 't' }]), /lowercase file name/, file);
  assert.throws(() => withArtifacts([{ file: 'a.png', title: 't', preview: 'b.png' }]), /only other files/);
  assert.throws(() => withArtifacts([{ file: 'a.ai', title: 't', preview: 'b.pdf' }]), /preview is a PNG/);
  assert.throws(() => withArtifacts([{ file: 'a.png' }]), /public text/);
  assert.throws(() => withArtifacts([{ file: 'a.png', title: 't', kind: 'image' }]), /Unknown field: kind/);
  assert.throws(() => withArtifacts([{ file: 'a.png', title: 't', source: 'http://example.com/' }]), /public HTTPS/);
  assert.throws(() => withArtifacts([{ file: 'a.png', title: 't', date: '2009-13' }]), /Invalid calendar date/);
  assert.throws(
    () =>
      withArtifacts([
        { file: 'a.png', title: 't' },
        { file: 'b.ai', title: 'u', preview: 'a.png' }
      ]),
    /Duplicate: a\.png/
  );
});

test('bundles group a thing’s artifacts: all of them or none, and never an empty one', () => {
  const withBundles = (bundles: unknown, artifacts: unknown) =>
    thing('example', { ...base, bundles, artifacts }, '', 'x');
  const bundles = [
    { id: 'the-plan', title: 'The plan', caption: 'What it set out to be.' },
    { id: 'before', title: 'Before' }
  ];
  const ok = withBundles(bundles, [
    { file: 'plan.md', title: 'The plan', bundle: 'the-plan' },
    { file: 'log.png', title: 'Log', bundle: 'before' },
    { file: 'scope.md', title: 'The scope', bundle: 'the-plan' }
  ]);
  assert.deepEqual(ok.bundles, bundles);
  assert.deepEqual(
    ok.artifacts?.map((a) => a.bundle),
    ['the-plan', 'before', 'the-plan']
  );
  assert.equal(thing('example', { ...base, bundles: [] }, '', 'x').bundles, undefined, 'no bundles, no list');
  assert.throws(
    () =>
      withBundles(bundles, [
        { file: 'plan.md', title: 'p', bundle: 'the-plan' },
        { file: 'log.png', title: 'l' }
      ]),
    /every artifact names one/
  );
  assert.throws(
    () => withBundles(bundles, [{ file: 'plan.md', title: 'p', bundle: 'after' }]),
    /No bundle has the id after/
  );
  assert.throws(
    () => withBundles(bundles, [{ file: 'plan.md', title: 'p', bundle: 'the-plan' }]),
    /No artifact is in the bundle before/
  );
  assert.throws(() => withBundles(bundles, []), /No artifact is in the bundle the-plan/);
  assert.throws(
    () => withBundles(undefined, [{ file: 'plan.md', title: 'p', bundle: 'the-plan' }]),
    /has no bundles to name/
  );
  assert.throws(
    () =>
      withBundles([...bundles, { id: 'before', title: 'Again' }], [{ file: 'a.png', title: 'a', bundle: 'before' }]),
    /Duplicate: before/
  );
  assert.throws(() => withBundles([{ id: 'The Plan', title: 't' }], []), /lowercase, hyphenated ID/);
  assert.throws(() => withBundles([{ id: 'plan' }], []), /public text/);
  assert.throws(() => withBundles([{ id: 'plan', title: 't', files: [] }], []), /Unknown field: files/);
});

// A one-pixel PNG: the eight-byte signature, then an IHDR chunk with the width and height.
const png = (width: number, height: number) => {
  const bytes = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes);
  bytes.writeUInt32BE(13, 8);
  bytes.write('IHDR', 12, 'latin1');
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
};
test('an artifact folder holds exactly the files its thing lists, and images are measured', async () => {
  const root = mkdtempSync(join(tmpdir(), 'artifacts-'));
  const folder = join(root, 'artifacts', 'example');
  mkdirSync(folder, { recursive: true });
  const example = thing(
    'example',
    {
      ...base,
      artifacts: [
        { file: 'logo.png', title: 'The logo' },
        { file: 'design.ai', title: 'The design', preview: 'design.png' }
      ]
    },
    '',
    'x'
  );
  writeFileSync(join(folder, 'logo.png'), png(200, 100));
  writeFileSync(join(folder, 'design.png'), png(787, 604));
  writeFileSync(join(folder, 'design.ai'), '%PDF-1.4');
  writeFileSync(join(folder, '.DS_Store'), 'the Finder’s');
  const files = await measureArtifacts(root, [example]);
  assert.deepEqual(files.get('example/logo.png'), { bytes: 33, width: 200, height: 100 });
  assert.deepEqual(files.get('example/design.ai'), { bytes: 8 });
  assert.equal(files.get('example/.DS_Store'), undefined);

  writeFileSync(join(folder, 'notes.txt'), 'unlisted');
  await assert.rejects(measureArtifacts(root, [example]), /notes\.txt: Not listed in things\/example\.md/);
  rmSync(join(folder, 'notes.txt'));
  rmSync(join(folder, 'design.png'));
  await assert.rejects(measureArtifacts(root, [example]), /design\.png: Listed, but not in the folder/);
  symlinkSync(join(folder, 'logo.png'), join(folder, 'design.png'));
  await assert.rejects(measureArtifacts(root, [example]), /design\.png: Expected a file, not a folder or a link/);
  rmSync(join(folder, 'design.png'));
  writeFileSync(join(folder, 'design.png'), 'not an image');
  await assert.rejects(measureArtifacts(root, [example]), /design\.png: Not an image/);
  writeFileSync(join(folder, 'design.png'), png(10, 10));
  writeFileSync(join(folder, 'design.ai'), '');
  await assert.rejects(measureArtifacts(root, [example]), /design\.ai: An artifact is between 1 byte and 25 MB/);
  await assert.rejects(measureArtifacts(root, []), /artifacts\/example: No thing lists artifacts/);
  const missing = mkdtempSync(join(tmpdir(), 'artifacts-'));
  await assert.rejects(measureArtifacts(missing, [example]), /lists artifacts, but the folder is missing/);
  assert.equal((await measureArtifacts(missing, [])).size, 0, 'no folder and nothing listed is fine');
});

test('image sizes are read from their headers, and files are named by kind and size', () => {
  assert.deepEqual(imageSize(png(200, 100)), { width: 200, height: 100 });
  const gif = Buffer.from('GIF89a\x14\x00\x10\x00\x00', 'latin1');
  assert.deepEqual(imageSize(gif), { width: 20, height: 16 });
  const webp = (chunk: string, fill: (bytes: Buffer) => void) => {
    const bytes = Buffer.alloc(30);
    bytes.write('RIFF', 0, 'latin1');
    bytes.write('WEBP', 8, 'latin1');
    bytes.write(chunk, 12, 'latin1');
    fill(bytes);
    return bytes;
  };
  const extended = webp('VP8X', (b) => {
    b.writeUIntLE(639, 24, 3);
    b.writeUIntLE(479, 27, 3);
  });
  assert.deepEqual(imageSize(extended), { width: 640, height: 480 });
  const lossless = webp('VP8L', (b) => {
    b[20] = 0x2f;
    b.writeUInt32LE(99 | (49 << 14), 21);
  });
  assert.deepEqual(imageSize(lossless), { width: 100, height: 50 });
  const lossy = webp('VP8 ', (b) => {
    b.writeUIntBE(0x9d012a, 23, 3);
    b.writeUInt16LE(320, 26);
    b.writeUInt16LE(240, 28);
  });
  assert.deepEqual(imageSize(lossy), { width: 320, height: 240 });
  // The collector's screenshots are real JPEGs whose observations record their size.
  const screenshots = 'data/observations/screenshot';
  const shots = readdirSync(screenshots).filter((name) => name.endsWith('.json'));
  assert.ok(shots.length > 0);
  for (const name of shots) {
    const shot = JSON.parse(readFileSync(join(screenshots, name), 'utf8')) as ScreenshotObservation;
    assert.deepEqual(imageSize(readFileSync(join(screenshots, shot.image))), {
      width: shot.width,
      height: shot.height
    });
  }
  assert.equal(imageSize(Buffer.from('not an image')), null);
  assert.equal(imageSize(png(0, 10)), null);
  assert.equal(artifactKind('design.ai'), 'Adobe Illustrator file');
  assert.equal(artifactKind('jerseys.zip'), 'ZIP archive');
  assert.equal(artifactKind('notes.xyz'), 'XYZ file');
  assert.equal(formatBytes(276), '276 bytes');
  assert.equal(formatBytes(5053), '5.1 KB');
  assert.equal(formatBytes(140_136), '140 KB');
  assert.equal(formatBytes(999_600), '1 MB');
  assert.equal(formatBytes(12_345_678), '12 MB');
});
