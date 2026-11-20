import { test, expect } from '@playwright/test';
import { fitsViewport, offline, watchErrors } from './helpers';

test.beforeEach(({ page }) => offline(page));

// Kubb: Throwing Wood's gadget frames one kept match from the game on the web (site/js/gadgets/kubb-throwing-wood-web.js).
// Tests never reach throwingwood.com: answered here with a stand-in page, the frame goes in once the gadget nears
// the screen; blocked, the gadget says the replay could not be reached, in place of the frame, and keeps its link.
const embed = 'https://throwingwood.com/e/4pqpg9bs';

test('the Kubb gadget places the game’s embed only once it nears the screen', async ({ page }) => {
  const errors = watchErrors(page);
  let requests = 0;
  await page.route(embed, (route) => {
    requests++;
    return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stand-in</title><p>replay</p>' });
  });
  await page.goto('/things/kubb-throwing-wood-web/');
  const gadget = page.locator('[data-kubb-replay]');
  await expect(gadget).toBeAttached();
  await expect(gadget.locator('a')).toHaveAttribute('href', /^https:\/\/throwingwood\.com\/p\/4pqpg9bs/);
  expect(requests).toBe(0);
  await gadget.scrollIntoViewIfNeeded();
  await expect(gadget).toBeVisible();
  const frame = gadget.locator('iframe');
  await expect(frame).toHaveAttribute('src', embed);
  await expect(frame).toHaveAttribute('title', 'A match of Kubb: Throwing Wood');
  await expect(page.frameLocator('[data-kubb-replay] iframe').locator('p')).toHaveText('replay');
  const box = await frame.boundingBox();
  expect(box && box.width >= 300 && box.height >= 187).toBe(true);
  expect(requests).toBeGreaterThanOrEqual(1);
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('the Kubb gadget says so and keeps its link when the embed cannot be reached', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/things/kubb-throwing-wood-web/');
  const gadget = page.locator('[data-kubb-replay]');
  await gadget.scrollIntoViewIfNeeded();
  await expect(gadget).toBeVisible();
  await expect(gadget.locator('[data-kubb-replay-status]')).toHaveText(
    'The replay could not be reached just now. The link below opens it on throwingwood.com.'
  );
  await expect(gadget.locator('iframe')).toHaveCount(0);
  await expect(gadget.locator('[data-kubb-replay-frame]')).toBeHidden();
  await expect(gadget.locator('[data-kubb-replay-how]')).toBeHidden();
  await expect(gadget.getByRole('link', { name: 'Open it on throwingwood.com' })).toBeVisible();
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});
