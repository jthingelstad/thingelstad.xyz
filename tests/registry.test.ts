import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { artifactKind, formatBytes, imageSize } from '../collection/artifacts';
import { loadRegistry, measureArtifacts, splitFrontmatter } from '../collection/load';
import type { ScreenshotObservation } from '../collection/schema';
import { checkReferences, thing, historyEvent, preciseDate } from '../collection/validate';

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
