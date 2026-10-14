import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const catalogSize = (JSON.parse(readFileSync('src/data/collection.json', 'utf8')) as { things: unknown[] }).things
  .length;

// Keep CI visits out of analytics and every guide question off AWS.
test.beforeEach(async ({ page }) => {
  await page.route('https://tinylytics.app/**', (route) => route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('**/api/explore', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'The guide is temporarily unavailable. Keep exploring.' })
    })
  );
});

test('browse the full graph, open a story, use Escape and retrace with Back', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.graph-node')).toHaveCount(catalogSize);
  const scrollport = await page.locator('.graph-scroll').boundingBox();
  const currentYear = await page.locator('.time-band').first().locator('text').first().boundingBox();
  expect(currentYear!.y).toBeGreaterThanOrEqual(scrollport!.y);
  expect(currentYear!.y + currentYear!.height).toBeLessThanOrEqual(scrollport!.y + scrollport!.height);
  await page.getByLabel('Choose a project').selectOption('elixir');
  await expect(page).toHaveURL(/focus=elixir/);
  await expect(page.locator('.selected-story h2')).toContainText('Elixir');
  await page.getByRole('button', { name: 'The story & the build' }).click();
  await expect(page).toHaveURL(/project=elixir/);
  await expect(page.locator('.detail-view h1')).toContainText('Elixir');
  await page.keyboard.press('Escape');
  await expect(page.locator('.graph-node')).toHaveCount(catalogSize);
  await page.goBack();
  await expect(page.locator('.detail-view h1')).toContainText('Elixir');
  await page.goBack();
  await expect(page.locator('.selected-story h2')).toContainText('Elixir');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('index filtering, empty results, and direct story links', async ({ page }) => {
  await page.goto('/?view=index');
  await expect(page.locator('.index-row')).toHaveCount(catalogSize);
  await page.getByLabel('Search the index').fill('Python');
  await expect(page.locator('.index-list')).toContainText('mb');
  await page.getByLabel('Search the index').fill('nonexistent xyz thing');
  await expect(page.locator('.empty-state')).toBeVisible();
  await page.goto('/?project=road-sign-math');
  await page.getByLabel('Reveal the road sign equation').click();
  await expect(page.getByLabel('Reveal the road sign equation')).toHaveText('35 + 65 = 100');
});

test('contextual guide explains privacy and gracefully handles an outage', async ({ page }) => {
  await page.goto('/?focus=elixir');
  await page.getByRole('button', { name: 'Explore with the AI guide' }).click();
  await expect(page.locator('.guide-privacy')).toContainText('30-day retention');
  await expect(page.locator('.guide-privacy')).toContainText('browser session');
  let payload: Record<string, unknown> | undefined;
  await page.route('**/api/explore', (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'The guide is temporarily unavailable. Keep exploring.' })
    });
  });
  await page.getByLabel('Ask about selected project').fill('How does this connect?');
  await page.getByRole('button', { name: 'Ask the guide', exact: true }).click();
  await expect(page.locator('.guide-error')).toContainText('temporarily unavailable');
  expect(payload?.contextId).toBe('elixir');
  await page.getByRole('button', { name: 'Keep browsing', exact: true }).click();
  await expect(page.locator('.guide-region')).toHaveCount(0);
  await expect(page.locator('.graph-node')).toHaveCount(catalogSize);
});

test('keyboard graph selection and mocked AI results continue the browsing path', async ({ page }) => {
  await page.goto('/');
  const node = page.getByRole('button', { name: 'Show connections for Elixir', exact: true });
  await node.focus();
  await node.press('Enter');
  await expect(node).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Explore with the AI guide' }).click();
  await page.route('**/api/explore', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'result',
        result: { message: 'Follow this public project connection.', projectIds: ['mb'], suggestions: [] }
      })
    })
  );
  await page.getByLabel('Ask about selected project').fill('Find a tool');
  await page.getByRole('button', { name: 'Ask the guide', exact: true }).click();
  await page.locator('.guide-projects').getByRole('button', { name: 'mb' }).click();
  await expect(page).toHaveURL(/focus=mb/);
  await expect(page.locator('.selected-story h2')).toHaveText('mb');
});

test('topics illuminate the whole graph and layout survives links and Back', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'MediaWiki 9', exact: true }).click();
  await expect(page).toHaveURL(/topic=mediawiki/);
  await expect(page.locator('.topic-description')).toContainText('Wikis as a place to build');
  await expect(page.locator('.graph-node')).toHaveCount(catalogSize);
  await expect(page.locator('.graph-node:not(.topic-muted)')).toHaveCount(9);
  await expect(page.getByRole('button', { name: 'Clear MediaWiki topic', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Connections', exact: true }).click();
  await expect(page).toHaveURL(/layout=map/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Connections', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Through time', exact: true }).click();
  await expect(page.locator('.time-band')).toHaveCount(7);
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Connections', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'All things', exact: true }).click();
  await expect(page.locator('.graph-node.topic-muted')).toHaveCount(0);
});

test('lineage has directional arrows and sourced history, with keyboard year navigation', async ({ page }) => {
  await page.goto('/?focus=elixir-bot');
  const lineage = page.locator('.lineage-edge[data-from="elixir-bot"]');
  await expect(lineage).toHaveCount(4);
  for (const edge of await lineage.all()) await expect(edge).toHaveAttribute('marker-end', 'url(#lineage-arrow)');
  await expect(page.locator('.project-history')).toContainText('Sep 26, 2026');
  await page.getByLabel('Jump to year').selectOption('2017');
  const echo = page.getByRole('button', { name: 'Explore history: The first Weekly Thing', exact: true });
  await echo.focus();
  await echo.press('Enter');
  await expect(page).toHaveURL(/view=history/);
  await expect(page.getByLabel('Choose history year')).toHaveValue('2017');
  await expect(page.locator('.history-events')).toContainText('The first Weekly Thing');
});

test('monthly history filters, year-only dates, source links, and project navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?view=history&year=2012');
  await expect(page.locator('.history-note')).toContainText('only a known year');
  await page.getByRole('button', { name: 'Jan 2012: 0 documented events', exact: true }).click();
  await expect(page.locator('.empty-state')).toContainText('No events');
  await page.goBack();
  await expect(page.locator('.history-events')).toContainText('A wiki to track other wikis');
  await page.getByLabel('Choose history year').selectOption('2026');
  await page.getByRole('button', { name: /Oct 2026:/ }).click();
  await expect(page).toHaveURL(/month=10/);
  await page.reload();
  await expect(page.locator('.history-list-heading')).toContainText('Oct 2026');
  await expect(page.locator('.event-source').first()).toHaveAttribute('href', /^https:\/\//);
  await page
    .locator('.history-event')
    .filter({ hasText: 'A place for upcoming dates' })
    .getByRole('button', { name: 'Release Notes', exact: true })
    .click();
  await expect(page.locator('.selected-story h2')).toHaveText('Release Notes');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('NNXYZ has sourced GitHub metadata and dot sizing has an explicit meaning', async ({ page }) => {
  await page.goto('/?focus=nnxyz');
  await expect(page.locator('.selected-story h2')).toHaveText('NNXYZ');
  await expect(page.locator('.project-sources')).toContainText('jthingelstad/nnxyz');
  await page.getByLabel('Dot size', { exact: true }).selectOption('history');
  await expect(page.locator('.map-sizing')).toContainText('Span between sourced events');
  await page.getByLabel('Dot size', { exact: true }).selectOption('activity');
  await expect(page.locator('.map-sizing')).toContainText('Complete 90-day');
  await page.getByRole('button', { name: 'The story & the build', exact: true }).click();
  await expect(page.locator('.detail-view h1')).toHaveText('NNXYZ');
  await expect(page.locator('.project-sources')).toContainText('This is not a launch date');
  await expect(page.locator('.project-sources')).toContainText('Observed');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('the public server does not expose the editor or write API', async ({ request }) => {
  expect((await request.get('/editor')).status()).toBe(404);
  expect((await request.get('/api/editor')).status()).toBe(404);
  expect((await request.post('/api/editor/save', { data: {} })).status()).toBe(404);
});
