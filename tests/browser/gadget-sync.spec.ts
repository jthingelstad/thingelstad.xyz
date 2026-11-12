import { test, expect } from '@playwright/test';
import { fitsViewport, offline, watchErrors } from './helpers';

test.beforeEach(({ page }) => offline(page));

// Sync's gadget reads status.json from the sync site in the browser (site/js/gadgets/sync.js). Tests never reach it:
// blocked, the gadget says so; answered here with a snapshot in status.json's shape, it shows the check, the counts,
// the hop that needs a look and each receipt in the sync page's words, and never runs the fetched text as markup.
const status = {
  checked_at: '2026-11-12T16:06:00Z',
  code: 'code/test.zip',
  trigger: { type: 'follow-up', minutes: 5, leg: 'web', kind: 'issue', id: '355' },
  summary: { hops: 41, late: 1, held: 0, moving: 1, fresh: 13, no_fact: 26, unknown: 0 },
  open: [{ id: 7, from: 'pinboard', to: 'links', kind: 'link', status: 'late' }],
  receipts: [
    {
      kind: 'issue',
      origin: 'weekly',
      item: {
        id: '354',
        at: '2026-10-24T12:00:00Z',
        url: 'https://weekly.thingelstad.com/archive/354/',
        title: 'WT354 — A museum for nnxyz art'
      },
      age_hours: 459.6,
      holders: [
        {
          system: 'wt-builder',
          kind: 'issue',
          label: null,
          state: 'no-fact',
          why: 'No published event has reached the bus yet.'
        },
        { system: 'librarian', kind: 'issue', label: null, state: 'has', newest: { id: '354' } },
        { system: 'thingy', kind: 'issue', label: null, state: 'has', newest: { id: '354' } },
        { system: 'cdn', kind: 'audio', label: 'audio edition', state: 'has', newest: { id: '354' } }
      ]
    },
    {
      kind: 'link',
      origin: 'pinboard',
      item: { id: '2026-11-10T09:34:31Z', at: '2026-11-10T09:34:31Z', url: 'https://pinboard.in/' },
      age_hours: 54,
      holders: [
        { system: 'links', kind: 'link', label: null, state: 'has', newest: { id: 'x' } },
        {
          system: 'librarian',
          kind: 'link',
          label: null,
          state: 'behind',
          newest: { id: 'y', at: '2026-11-09T15:00:00Z' }
        }
      ]
    },
    {
      kind: 'star',
      origin: 'feedbin',
      item: { id: '1', url: 'https://example.com/', title: '<img src=x onerror="window.hacked=1">', at: null },
      age_hours: null,
      holders: [{ system: 'pinboard', kind: 'star', label: null, state: 'has', newest: { id: '1' } }]
    },
    { kind: 'episode', origin: 'another', item: null, holders: [] }
  ]
};

test('the sync gadget says so when the sync page cannot be read', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/things/sync/');
  const panel = page.locator('[data-sync-now]');
  await expect(panel).toBeVisible();
  await expect(panel.locator('[data-sync-error]')).toContainText('could not be read just now');
  await expect(panel.locator('.sync-receipt')).toHaveCount(0);
  await expect(page.locator('.gadget-needs-script')).toBeHidden();
  expect(errors).toEqual([]);
});

test('the sync gadget shows the check, the counts and the receipts in the sync page’s words', async ({ page }) => {
  const errors = watchErrors(page);
  let reads = 0;
  await page.route('https://sync.thingelstad.xyz/status.json', (route) => {
    reads++;
    return route.fulfill({
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      json: status
    });
  });
  await page.goto('/things/sync/');
  const panel = page.locator('[data-sync-now]');
  await expect(panel.locator('[data-sync-checked]')).toHaveText(
    /^Checked Thu Nov 12, 10:06 a\.m\. CST, on the 5 min follow-up for the web leg of WT355\.$/
  );
  await expect(panel.locator('.sync-count')).toHaveText([
    '41 hops',
    '13 fresh',
    '1 moving',
    '1 late',
    '0 held',
    '26 no fact yet'
  ]);
  await expect(panel.locator('.sync-attention li')).toHaveText('Pinboard → Linking Things · link late');
  const receipts = panel.locator('.sync-receipt');
  await expect(receipts).toHaveCount(4);
  const issue = receipts.nth(0);
  await expect(issue.locator('h4')).toHaveText('Weekly Thing issue');
  await expect(issue.locator('.sync-item')).toHaveText('WT354 A museum for nnxyz art');
  await expect(issue).toContainText('Sat Oct 24, 7:00 a.m. CDT, 19 d 4 h ago · from Weekly Thing (web)');
  await expect(issue.locator('.sync-holders--has')).toHaveText(
    'Has it: Librarian; Thingy; files.thingelstad.com (audio edition)'
  );
  await expect(issue.locator('.sync-holders--no-fact')).toHaveText('No fact yet: WT Builder');
  await expect(receipts.nth(1).locator('.sync-item')).toHaveText('saved Tue Nov 10, 3:34 a.m. CST');
  await expect(receipts.nth(1).locator('.sync-holders--behind')).toHaveText(
    'Behind: Librarian (saved Mon Nov 9, 9:00 a.m. CST)'
  );
  await expect(receipts.nth(2).locator('.sync-item')).toHaveText('<img src=x onerror="window.hacked=1">');
  await expect(receipts.nth(2)).toContainText('undated · from Feedbin');
  await expect(receipts.nth(3)).toContainText('No system publishes a fact for the newest episode yet.');
  await expect(panel.locator('[data-sync-error]')).toBeHidden();
  expect(await page.evaluate(() => (window as unknown as { hacked?: number }).hacked)).toBeUndefined();
  await expect(panel.locator('a[href="https://sync.thingelstad.xyz/"]')).toHaveCount(1);
  expect(reads).toBe(1);
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});
