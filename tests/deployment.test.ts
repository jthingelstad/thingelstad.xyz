import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { cacheControlFor, contentTypeFor, publishOrder } from '../scripts/publish-plan.mjs';

test('the site is published assets first, pages after, the front page last, each with its content type', () => {
  const dir = mkdtempSync(join(tmpdir(), 'site-'));
  for (const file of [
    'index.html',
    'things.json',
    'feed.xml',
    'things/elixir/index.html',
    'things/elixir.md',
    'assets/site-1.css'
  ]) {
    mkdirSync(join(dir, dirname(file)), { recursive: true });
    writeFileSync(join(dir, file), '');
  }
  const order = publishOrder(dir);
  assert.deepEqual(order, [
    'assets/site-1.css',
    'feed.xml',
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
});
