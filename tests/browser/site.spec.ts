import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Thing = { id: string; title: string; status: string; topics: string[]; sources: { kind: string }[] };
type Output = { things: Thing[]; topics: { id: string; title: string }[]; history: { id: string; title: string }[] };
const { things, topics, history } = JSON.parse(readFileSync('_site/things.json', 'utf8')) as Output;

// Keep CI visits out of analytics. The embed is intercepted, never loaded.
let analyticsRequests = 0;
test.beforeEach(async ({ page }) => {
  analyticsRequests = 0;
  await page.route('https://tinylytics.app/**', (route) => {
    analyticsRequests++;
    return route.fulfill({ contentType: 'text/javascript', body: '' });
  });
});
const watchErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
};
const fitsViewport = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test('the index lists every thing with its status and leads to its page', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page.locator('.thing-row')).toHaveCount(things.length);
  for (const status of ['active', 'dormant', 'retired', 'archived']) {
    const count = things.filter((thing) => thing.status === status).length;
    await expect(page.locator(`.thing-row .status-${status}`)).toHaveCount(count);
  }
  expect(await fitsViewport(page)).toBe(true);
  await page.getByRole('link', { name: 'Weekly Thing', exact: true }).first().click();
  await expect(page).toHaveURL(/\/things\/weekly-thing\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Weekly Thing');
  await expect(page.locator('.facts')).toContainText('May 13, 2017');
  const weekly = things.find((thing) => thing.id === 'weekly-thing')!;
  await expect(page.locator('.source-list .source')).toHaveCount(weekly.sources.length);
  await expect(page.locator('.sources')).toContainText('never sets a status');
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
  expect(analyticsRequests).toBeGreaterThan(0);
});

test('connections link both ways and topics gather their things', async ({ page }) => {
  await page.goto('/things/elixir-bot/');
  await expect(page.locator('.facts .status-retired')).toBeVisible();
  await page.locator('.connection-list').getByRole('link', { name: 'Elixir', exact: true }).first().click();
  await expect(page).toHaveURL(/\/things\/elixir\/$/);
  await expect(page.locator('.connection-list')).toContainText('Elixir Bot');
  await page.locator('.facts').getByRole('link', { name: 'Agents' }).click();
  await expect(page).toHaveURL(/\/topics\/agents\/$/);
  const members = things.filter((thing) => thing.topics.includes('agents'));
  await expect(page.locator('.thing-row')).toHaveCount(members.length);
  await page.goto('/topics/');
  await expect(page.locator('.topic-list > li')).toHaveCount(topics.length);
});

test('history anchors, the timeline, and the machine outputs are reachable', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/things/weekly-thing/');
  await page.locator('.event-list').getByRole('link').first().click();
  await expect(page).toHaveURL(/\/history\/#[a-z0-9-]+$/);
  const anchor = new URL(page.url()).hash.slice(1);
  await expect(page.locator(`#${anchor}`)).toBeInViewport();
  await expect(page.locator('.event-list > li')).toHaveCount(history.length);
  await page.goto('/timeline/');
  await expect(page.locator('.timeline .tl-row').first()).toBeVisible();
  const dot = page.locator('.tl-event').first();
  await dot.hover();
  await expect(page.locator('.tooltip')).toBeVisible();
  await dot.focus();
  await expect(page.locator('.tooltip')).toContainText(/\d{4}/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.tooltip')).toBeHidden();
  expect(await fitsViewport(page)).toBe(true);
  for (const path of [
    '/feed.xml',
    '/feed.json',
    '/llms.txt',
    '/llms-full.txt',
    '/things.json',
    '/things/weekly-thing.md'
  ]) {
    const response = await page.request.get(path);
    expect(response.ok(), path).toBe(true);
  }
  const missing = await page.request.get('/things/nothing-here/');
  expect(missing.status()).toBe(404);
  expect(errors).toEqual([]);
});

test('connection diagrams are static SVG whose nodes lead to their things', async ({ page }) => {
  const errors = watchErrors(page);
  const phone = page.viewportSize()!.width <= 720;
  await page.goto('/things/mb/');
  const small = page.locator('.connection-diagram svg:visible');
  await expect(small).toHaveCount(1);
  await expect(small).toHaveAccessibleName('Connections of mb');
  expect(await fitsViewport(page)).toBe(true);
  await page.goto('/things/elixir-bot/');
  if (phone) {
    await expect(page.locator('.connection-diagram'), 'a hub too wide for a phone is left to the list').toBeHidden();
  } else {
    await page.locator('.connection-diagram svg:visible a[href="/things/elixir/"]').click();
    await expect(page).toHaveURL(/\/things\/elixir\/$/);
  }
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});
