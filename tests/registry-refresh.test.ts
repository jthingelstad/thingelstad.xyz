import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registryRefresh, registryVersion } from '../collection/registry-refresh';

const before = {
  generated: '2026-10-26T00:00:00Z',
  things: [{ id: 'example', title: 'Before', body: 'public fixture' }]
};
const built = {
  generated: '2026-10-27T00:00:00Z',
  things: [{ id: 'example', title: 'After', body: 'private-canary' }]
};
const at = '2026-10-27T09:00:00Z';
test('only a verified changed public registry reports its opaque document revision', () => {
  const event = registryRefresh(before, built, built, at);
  assert.deepEqual(event, {
    source: 'xyz',
    'detail-type': 'refreshed',
    detail: { id: registryVersion(built), at, url: 'https://thingelstad.xyz/things.json' }
  });
  assert.ok(!JSON.stringify(event).includes('private-canary'));
  assert.equal(registryRefresh(null, built, built, at), null);
  assert.equal(registryRefresh(before, built, before, at), null);
  assert.equal(registryRefresh(before, built, built, '2026-02-30T00:00:00Z'), null);
});
test('build clocks and key order alone are not new registry content', () => {
  const clockOnly = { ...before, generated: built.generated };
  assert.equal(registryVersion(clockOnly), registryVersion(before));
  assert.equal(registryRefresh(before, clockOnly, clockOnly, at), null);
  assert.equal(registryVersion({ things: before.things, generated: before.generated }), registryVersion(before));
  assert.equal(registryVersion({ things: 'malformed' }), null);
});
