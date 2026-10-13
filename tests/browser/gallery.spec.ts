import { test, expect } from '@playwright/test';

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
  await expect(page.locator('.graph-node')).toHaveCount(49);
  await page.getByLabel('Choose a project').selectOption('elixir');
  await expect(page).toHaveURL(/focus=elixir/);
  await expect(page.locator('.selected-story h2')).toContainText('Elixir');
  await page.getByRole('button', { name: 'The story & the build' }).click();
  await expect(page).toHaveURL(/project=elixir/);
  await expect(page.locator('.detail-view h1')).toContainText('Elixir');
  await page.keyboard.press('Escape');
  await expect(page.locator('.graph-node')).toHaveCount(49);
  await page.goBack();
  await expect(page.locator('.detail-view h1')).toContainText('Elixir');
  await page.goBack();
  await expect(page.locator('.selected-story h2')).toContainText('Elixir');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('index filtering, empty results, and direct story links', async ({ page }) => {
  await page.goto('/?view=index');
  await expect(page.locator('.index-row')).toHaveCount(49);
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
  await expect(page.locator('.graph-node')).toHaveCount(49);
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
