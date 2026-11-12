import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observeValidators, parseDoraSlots, slotDate } from '../collection/adapters/beacon';
import { collect, sameEvidence } from '../collection/collect';
import { observationPath } from '../collection/observations';
import { thing as parseThing } from '../collection/validate';
import type { Observation, Registry, Thing, ValidatorsObservation } from '../collection/schema';

const now = new Date('2026-11-12T12:00:00Z');
const noPause = async () => {};
const node: Thing = {
  id: 'node',
  title: 'Node',
  summary: 'A validator node.',
  collection: 'Developer tools and systems',
  status: 'active',
  url: null,
  topics: [],
  sources: [],
  connections: [],
  validators: { chain: 'gnosis', indices: [9, 7] },
  body: ''
};
const badge = { Proposed: 'success', Missed: 'warning', Orphaned: 'info', Scheduled: 'secondary' };
const row = (slot: number, status: keyof typeof badge) =>
  `<tr><td><a href="/epoch/${Math.floor(slot / 16)}">e</a></td><td><a href="/slot/${slot}">${slot}</a></td>` +
  `<td> <span class="badge rounded-pill text-bg-${badge[status]}">${status}</span> </td></tr>`;
const page = (rows: string[]) =>
  `<html><div class="table-meta">Showing</div><table><tbody>${rows.join('')}</tbody></table></html>`;
const feb = 936_100; // a slot on 2022-02-01
// Dora: validator 7 has a full page of proposals and a second page; 9 has one, and a slot still to come.
const doraPages: Record<string, string> = {
  '7/0': page(Array.from({ length: 100 }, (_, i) => row(100 + i, 'Proposed'))),
  '7/1': page([row(feb, 'Proposed'), row(300, 'Missed'), row(301, 'Orphaned')]),
  '9/0': page([row(999_999_999, 'Scheduled'), row(200_000, 'Proposed')])
};
type Item = { slot: number; epoch: number; status: string; exec_fee_recipient?: string };
function explorerFetcher(finalized: number, proposals: Item[] = [], asked: string[] = []) {
  return async (url: string) => {
    asked.push(url);
    const dora = /f\.proposer=(\d+)&c=100&s=(\d+)$/.exec(url);
    if (dora) return doraPages[`${dora[1]}/${dora[2]}`] ?? page([]);
    if (url.endsWith('/epoch/finalized')) return JSON.stringify({ status: 'OK', data: { epoch: finalized } });
    const window = /\/proposals\?epoch=(\d+)$/.exec(url);
    if (window) {
      const epoch = Number(window[1]);
      return JSON.stringify({
        status: 'OK',
        data: proposals.filter((p) => p.epoch >= epoch - 100 && p.epoch <= epoch)
      });
    }
    if (url.endsWith('/validator/7,9'))
      return JSON.stringify({
        status: 'OK',
        data: [
          { validatorindex: 7, status: 'active_online', slashed: false, balance: 32_000_000_000 },
          { validatorindex: 9, status: 'active_offline', slashed: false, balance: 31_000_000_000 }
        ]
      });
    throw new Error(`unexpected ${url}`);
  };
}

test('Dora rows give each slot and its status, and a changed page stops the collector', () => {
  assert.deepEqual(parseDoraSlots(page([row(5, 'Missed'), row(4, 'Proposed')])), [
    { slot: 5, status: 'missed' },
    { slot: 4, status: 'proposed' }
  ]);
  assert.deepEqual(parseDoraSlots(page(['<tr><td colspan="9">No slots found</td></tr>'])), []);
  assert.throws(() => parseDoraSlots('<html>Too many requests</html>'), /without its slot table/);
  assert.throws(() => parseDoraSlots(page(['<tr><td><a href="/slot/9">9</a></td><td>?</td></tr>'])), /no status/);
});

test('the first observation reads every validator’s history from Dora, counts only', async () => {
  const asked: string[] = [];
  const observation = await observeValidators(node, undefined, explorerFetcher(60_000, [], asked), now, noPause);
  assert.deepEqual(
    asked.filter((u) => u.includes('dora')).map((u) => u.replace(/.*proposer=/, '')),
    ['7&c=100&s=0', '7&c=100&s=1', '9&c=100&s=0']
  );
  assert.equal(observationPath(observation), 'data/observations/validators/node.json');
  assert.deepEqual(observation.indices, [7, 9]);
  assert.equal(observation.until, 60_000);
  assert.deepEqual([observation.validators, observation.active, observation.online, observation.slashed], [2, 2, 1, 0]);
  assert.deepEqual([observation.proposed, observation.missed, observation.orphaned], [102, 1, 1]);
  assert.equal(observation.firstProposal, slotDate(100));
  assert.equal(observation.latestProposal, '2022-02-01');
  assert.deepEqual(observation.months, [
    { month: '2021-12', proposed: 101, missed: 1, orphaned: 1 },
    { month: '2022-01', proposed: 0, missed: 0, orphaned: 0 },
    { month: '2022-02', proposed: 1, missed: 0, orphaned: 0 }
  ]);
  assert.ok(!JSON.stringify(observation).includes('balance'));
});

test('Dora ignoring the page number is an error, not an endless read', async () => {
  const stuck = async (url: string) => (url.includes('dora') ? doraPages['7/0'] : explorerFetcher(60_000)(url));
  await assert.rejects(observeValidators(node, undefined, stuck, now, noPause), /same page twice/);
});

test('later observations count on from the last finalized epoch, once each, without the fee recipient', async () => {
  const first = await observeValidators(node, undefined, explorerFetcher(60_000), now, noPause);
  const proposals: Item[] = [
    { slot: 960_005, epoch: 60_000, status: '1' }, // already counted
    { slot: 961_603, epoch: 60_100, status: '1', exec_fee_recipient: '0xdead' }, // in two windows
    { slot: 964_000, epoch: 60_250, status: '2' }
  ];
  const asked: string[] = [];
  const later = await observeValidators(node, first, explorerFetcher(60_250, proposals, asked), now, noPause);
  assert.deepEqual(
    asked.filter((u) => u.includes('/proposals')).map((u) => u.replace(/.*epoch=/, '')),
    ['60100', '60200', '60250']
  );
  assert.ok(!asked.some((u) => u.includes('dora')));
  assert.deepEqual([later.until, later.proposed, later.missed, later.orphaned], [60_250, 103, 2, 1]);
  assert.equal(later.latestProposal, slotDate(961_603));
  assert.deepEqual(later.months.at(-1), { month: '2022-02', proposed: 2, missed: 1, orphaned: 0 });
  assert.ok(!JSON.stringify(later).includes('0xdead'));
  // Nothing new since: the same evidence, so the collector writes nothing however far `until` moved.
  const quiet = await observeValidators(node, later, explorerFetcher(60_400, proposals), now, noPause);
  assert.ok(sameEvidence(later, quiet));
  // A different set of validators is counted again from Dora.
  const fresh = await observeValidators(
    { ...node, validators: { chain: 'gnosis', indices: [7] } },
    later,
    async (url) =>
      url.endsWith('/validator/7')
        ? JSON.stringify({ status: 'OK', data: { validatorindex: 7, status: 'active_online', slashed: false } })
        : explorerFetcher(60_000)(url),
    now,
    noPause
  );
  assert.deepEqual([fresh.validators, fresh.proposed, fresh.missed], [1, 101, 1]);
});

test('the collector observes things with validators, and skips them when told to', async () => {
  const registry: Registry = { things: [node], topics: [], history: [], featured: [], stories: [], interviews: [] };
  const options = {
    registry,
    git: null,
    tinylytics: null,
    wayback: null,
    screenshots: null,
    pause: noPause,
    now,
    log: () => {}
  } as const;
  const saved: Observation[] = [];
  const first = await collect({
    ...options,
    existing: [],
    beacon: explorerFetcher(60_000),
    save: async (o) => (saved.push(o), 'x')
  });
  assert.deepEqual(first.written, ['validators node']);
  const second = await collect({
    ...options,
    existing: saved,
    beacon: explorerFetcher(60_100),
    save: async () => assert.fail('nothing new')
  });
  assert.deepEqual(second.unchanged, ['validators node']);
  const skipped = await collect({ ...options, existing: [], beacon: null, save: async () => assert.fail('skipped') });
  assert.deepEqual(skipped.written, []);
  assert.equal((saved[0] as ValidatorsObservation).thing, 'node');
});

test('a record lists Gnosis validators by index, each once', () => {
  const base = { title: 'Node', summary: 'A node.', collection: 'Developer tools and systems', status: 'active' };
  const parsed = parseThing('node', { ...base, validators: { chain: 'gnosis', indices: [3, 1] } }, '', 'node');
  assert.deepEqual(parsed.validators, { chain: 'gnosis', indices: [3, 1] });
  assert.throws(() => parseThing('node', { ...base, validators: { chain: 'ethereum', indices: [1] } }, '', 'n'));
  assert.throws(() => parseThing('node', { ...base, validators: { chain: 'gnosis', indices: [1, 1] } }, '', 'n'));
  assert.throws(() => parseThing('node', { ...base, validators: { chain: 'gnosis', indices: [] } }, '', 'n'));
  assert.throws(() => parseThing('node', { ...base, validators: { chain: 'gnosis', indices: ['1'] } }, '', 'n'));
});
