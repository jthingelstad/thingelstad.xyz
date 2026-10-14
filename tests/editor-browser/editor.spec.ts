import { test, expect } from '@playwright/test';

test('add a thing, attach shared sources, explain a connection, preview, save, and reload', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  let network = 0;
  await page.route('https://**/*', (route) => {
    network++;
    return route.abort();
  });
  await page.goto('/');
  await expect(page).toHaveTitle('Collection editor — Things I’ve built');
  await expect(page.locator('main h2').first()).toHaveText('NNXYZ');
  await page.locator('.new-thing-disclosure summary').click();
  await page.getByLabel('New thing title', { exact: true }).fill(`Test gallery ${info.project.name}`);
  await page.getByRole('button', { name: 'Add to collection', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Short description', exact: true })
    .fill('A disposable project for editor verification.');
  await page.getByLabel('Website or public destination').fill('https://example.com/gallery/');
  await page.getByLabel('New source address').fill('https://github.com/jthingelstad/nnxyz');
  await page.getByRole('button', { name: 'Attach source', exact: true }).click();
  await page.getByLabel('New source address').fill('jthingelstad/mb');
  await page.getByRole('button', { name: 'Attach source', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Source 1', exact: true })).toHaveValue('github-nnxyz');
  await expect(page.getByRole('combobox', { name: 'Source 2', exact: true })).toHaveValue('github-mb');
  await page.getByRole('button', { name: 'Add a connection', exact: true }).click();
  await page.getByRole('combobox', { name: 'To', exact: true }).selectOption('nnxyz');
  await page.getByLabel('Relationship', { exact: true }).fill('explores');
  await page.getByLabel('Explanation', { exact: true }).fill('A test relationship with the existing gallery.');
  await page.getByLabel('Supporting reference', { exact: true }).fill('https://example.com/about/');
  await page.getByRole('button', { name: 'Preview draft', exact: true }).click();
  await expect(page.locator('.draft-preview')).toContainText('explores NNXYZ');
  await expect(page.locator('.draft-preview')).toContainText('2 attached sources');
  await page.getByRole('button', { name: 'Save collection', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Saved to the collection');
  await page.reload();
  if (info.project.name === 'phone')
    await page
      .getByRole('combobox', { name: 'Choose a thing', exact: true })
      .selectOption(`test-gallery-${info.project.name}`);
  else {
    await page.getByLabel('Find a thing').fill(`Test gallery ${info.project.name}`);
    await page.getByRole('button', { name: `Test gallery ${info.project.name}`, exact: false }).click();
  }
  await expect(page.getByRole('textbox', { name: 'Short description', exact: true })).toHaveValue(
    'A disposable project for editor verification.'
  );
  await expect(page.getByRole('combobox', { name: 'Source 2', exact: true })).toHaveValue('github-mb');
  await expect(page.getByLabel('Relationship', { exact: true })).toHaveValue('explores');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('heading', { name: 'Your collection.' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/tmp/thingelstad-editor-${info.project.name}.png`, fullPage: false });
  expect(errors).toEqual([]);
  expect(network).toBe(0);
});

test('a stale save keeps the draft and a mocked refresh does not overwrite prose', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Title', { exact: true }).fill('NNXYZ draft retained');
  await page.route('**/api/editor/save', (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'The collection changed. Reload before saving; your draft has been kept.' })
    })
  );
  await page.getByRole('button', { name: 'Save collection', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('draft has been kept');
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('NNXYZ draft retained');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reload saved collection' }).click();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('NNXYZ');
  await page.route('**/api/editor/refresh', async (route) => {
    const response = await page.request.get('/api/editor', { headers: { 'X-Editor-Request': '1' } });
    const data = (await response.json()) as { github: unknown };
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ github: data.github }) });
  });
  await page.getByRole('button', { name: 'Refresh GitHub evidence', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('evidence refreshed');
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('NNXYZ');
});
