import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { cacheControlFor, contentTypeFor, publishOrder } from '../scripts/publish-plan.mjs';
import { viewerRequestCode } from '../infra/viewer-request.mjs';

test('the site is published assets first, pages after, the front page last, each with its content type', () => {
  const dir = mkdtempSync(join(tmpdir(), 'site-'));
  for (const file of [
    'index.html',
    'things.json',
    'feed.xml',
    'things/elixir/index.html',
    'things/elixir.md',
    'assets/site-1.css',
    'pagefind/pagefind.js',
    'pagefind/fragment/en_1a2b3c.pf_fragment'
  ]) {
    mkdirSync(join(dir, dirname(file)), { recursive: true });
    writeFileSync(join(dir, file), '');
  }
  const order = publishOrder(dir);
  assert.deepEqual(order, [
    'assets/site-1.css',
    'pagefind/fragment/en_1a2b3c.pf_fragment',
    'feed.xml',
    'pagefind/pagefind.js',
    'things.json',
    'things/elixir.md',
    'things/elixir/index.html',
    'index.html'
  ]);
  assert.equal(cacheControlFor('assets/site-1.css'), 'public,max-age=31536000,immutable');
  assert.equal(cacheControlFor('things/elixir/index.html'), 'no-cache');
  assert.equal(contentTypeFor('things/elixir.md'), 'text/markdown; charset=utf-8');
  assert.equal(contentTypeFor('feed.xml'), 'application/xml; charset=utf-8');
  assert.throws(() => contentTypeFor('mystery.bin'));
  // A thing's artifacts can be any file. Images, PDFs and archives are served as what they are; anything else,
  // a page or a script among them, as bytes to download, so it never runs as a page of this site.
  assert.equal(contentTypeFor('things/velotweets/artifacts/masthead-logo.png'), 'image/png');
  assert.equal(contentTypeFor('things/velotweets/artifacts/jerseys.zip'), 'application/zip');
  assert.equal(contentTypeFor('things/example/artifacts/design.ai'), 'application/octet-stream');
  assert.equal(contentTypeFor('things/example/artifacts/old-home.html'), 'application/octet-stream');
  assert.equal(contentTypeFor('things/example/artifacts/logo.svg'), 'application/octet-stream');
  assert.equal(cacheControlFor('things/velotweets/artifacts/jerseys.zip'), 'no-cache');
  assert.throws(() => contentTypeFor('things/velotweets/mystery.bin'), /No content type/);
  // The search index: Pagefind names its index files by their content, but not its scripts, wasm or entry file.
  assert.equal(cacheControlFor('pagefind/fragment/en_1a2b3c.pf_fragment'), 'public,max-age=31536000,immutable');
  assert.equal(cacheControlFor('pagefind/pagefind.en_185a4f95c4.pf_meta'), 'public,max-age=31536000,immutable');
  assert.equal(cacheControlFor('pagefind/pagefind.js'), 'no-cache');
  assert.equal(cacheControlFor('pagefind/wasm.en.pagefind'), 'no-cache');
  assert.equal(cacheControlFor('pagefind/pagefind-entry.json'), 'no-cache');
  assert.equal(cacheControlFor('things/page.pf_fragment'), 'no-cache');
  assert.equal(contentTypeFor('pagefind/wasm.en.pagefind'), 'application/octet-stream');
  assert.equal(contentTypeFor('pagefind/index/en_1a2b3c.pf_index'), 'application/octet-stream');
});

test('the viewer-request function serves directory indexes, adds the slash, and sends www to the apex', () => {
  const handler = new Function(`${viewerRequestCode}\nreturn handler;`)() as (event: unknown) => {
    uri?: string;
    statusCode?: number;
    headers?: { location?: { value: string } };
  };
  const request = (host: string, uri: string, querystring: Record<string, unknown> = {}) => ({
    request: { uri, querystring, headers: { host: { value: host } } }
  });
  const location = (result: ReturnType<typeof handler>) => result.headers?.location?.value;
  assert.equal(handler(request('thingelstad.xyz', '/')).uri, '/index.html');
  assert.equal(handler(request('thingelstad.xyz', '/things/elixir/')).uri, '/things/elixir/index.html');
  assert.equal(handler(request('thingelstad.xyz', '/feed.xml')).uri, '/feed.xml');
  const bare = handler(request('thingelstad.xyz', '/things/elixir', { a: { value: '1' } }));
  assert.equal(bare.statusCode, 301);
  assert.equal(location(bare), '/things/elixir/?a=1');
  assert.equal(location(handler(request('www.thingelstad.xyz', '/'))), 'https://thingelstad.xyz/');
  assert.equal(
    location(handler(request('www.thingelstad.xyz', '/things/elixir'))),
    'https://thingelstad.xyz/things/elixir/'
  );
  assert.equal(location(handler(request('www.thingelstad.xyz', '/feed.xml'))), 'https://thingelstad.xyz/feed.xml');
  const query = { utm_source: { value: 'x', multiValue: [{ value: 'x' }, { value: 'y' }] }, flag: { value: '' } };
  assert.equal(
    location(handler(request('WWW.thingelstad.xyz', '/history/', query))),
    'https://thingelstad.xyz/history/?utm_source=x&utm_source=y&flag'
  );
});
