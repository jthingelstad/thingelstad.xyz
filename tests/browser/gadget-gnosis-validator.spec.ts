import { test, expect } from '@playwright/test';
import { fitsViewport, offline, watchErrors } from './helpers';

test.beforeEach(({ page }) => offline(page));

// The Gnosis Validator's gadget reads the public beacon node from the browser (site/js/gadgets/gnosis-validator.js). Tests never
// reach it: blocked, the panel says so and keeps the clock; answered here, it lights the dots the balances earn and
// counts down to a proposal by one of the validators.
const beacon = 'https://rpc-gbc.gnosischain.com';
const chainSlot = () => Math.floor((Date.now() / 1000 - 1638993340) / 5);

test('the chain gadget keeps the clock and says so when the beacon node cannot be reached', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/things/gnosis-validator/');
  const panel = page.locator('[data-chain-live]');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.chain-validators li')).toHaveCount(32);
  await expect(panel.locator('[data-chain-slot]')).toContainText(/^Slot \d{2},\d{3},\d{3}$/);
  await expect(panel.locator('[data-chain-summary]')).toContainText('could not be reached');
  await expect(panel.locator('.chain-validators li.is-lit')).toHaveCount(0);
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('the chain gadget lights the validators that earned and counts down to their next proposal', async ({ page }) => {
  const errors = watchErrors(page);
  const head = chainSlot();
  const epoch = Math.floor(head / 16);
  const due = head + 6; // within the current or the next epoch, whichever it falls in
  let indices: string[] = [];
  await page.route(`${beacon}/**`, (route) => {
    const url = new URL(route.request().url());
    const json = (data: unknown) => route.fulfill({ contentType: 'application/json', json: { data } });
    if (url.pathname === '/eth/v1/beacon/headers/head') return json({ header: { message: { slot: String(head) } } });
    const state = /\/eth\/v1\/beacon\/states\/(\d+)\/validator_balances$/.exec(url.pathname);
    if (state) {
      const ids = url.searchParams.get('id')!.split(',');
      indices = ids;
      // Now: the first half rose by a reward, the second fell by a penalty, and one was swept down to just above 32.
      const earlier = Number(state[1]) < head;
      return json(
        ids.map((index, i) => ({
          index,
          balance: String(
            i === ids.length - 1
              ? earlier
                ? 32_400_000_000
                : 32_000_500_000
              : 32_000_000_000 + (earlier ? 0 : i < ids.length / 2 ? 9_000 : -9_000)
          )
        }))
      );
    }
    const duties = /\/eth\/v1\/validator\/duties\/proposer\/(\d+)$/.exec(url.pathname);
    if (duties) {
      const rows = [{ validator_index: '1', slot: String(Number(duties[1]) * 16) }];
      if (Math.floor(due / 16) === Number(duties[1])) rows.push({ validator_index: '106860', slot: String(due) });
      return json(rows);
    }
    return route.abort('blockedbyclient');
  });
  await page.goto('/things/gnosis-validator/');
  const panel = page.locator('[data-chain-live]');
  await expect(panel.locator('[data-chain-summary]')).toContainText('17 of the 32 attesting');
  expect(indices).toHaveLength(32);
  await expect(panel.locator('.chain-validators li.is-lit')).toHaveCount(17);
  await expect(panel.locator('.chain-validators li[data-index="106644"]')).toHaveClass(/is-lit/);
  await expect(panel.locator('[data-chain-duty]')).toContainText(
    new RegExp(`Validator 106860 is due to propose slot ${due.toLocaleString('en-US')} in \\d+ seconds`)
  );
  if (Math.floor(due / 16) === epoch) await expect(panel.locator('.chain-epoch li.is-due')).toHaveCount(1);
  expect(errors).toEqual([]);
});
