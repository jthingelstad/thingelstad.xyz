import { test, expect } from '@playwright/test';
import { fitsViewport, offline, watchErrors } from './helpers';

test.beforeEach(({ page }) => offline(page));

// Kubb: Throwing Wood's gadget frames one kept match from the game on the web (site/js/gadgets/kubb-throwing-wood.js).
// Tests never reach kubb.thingelstad.xyz: the frame is answered here with a stand-in page. The frame goes in only once
// the gadget nears the screen, and the link to the match works without it.
const embed = 'https://kubb.thingelstad.xyz/e/4pqpg9bs';

test('the Kubb gadget places the game’s embed only once it nears the screen', async ({ page }) => {
  const errors = watchErrors(page);
  let requests = 0;
  await page.route(embed, (route) => {
    requests++;
    return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stand-in</title><p>replay</p>' });
  });
  await page.goto('/things/kubb-throwing-wood/');
  const gadget = page.locator('[data-kubb-replay]');
  await expect(gadget).toBeAttached();
  await expect(gadget.locator('a')).toHaveAttribute('href', /^https:\/\/kubb\.thingelstad\.xyz\/p\/4pqpg9bs/);
  expect(requests).toBe(0);
  await gadget.scrollIntoViewIfNeeded();
  await expect(gadget).toBeVisible();
  const frame = gadget.locator('iframe');
  await expect(frame).toHaveAttribute('src', embed);
  await expect(frame).toHaveAttribute('title', 'A match of Kubb: Throwing Wood');
  await expect(page.frameLocator('[data-kubb-replay] iframe').locator('p')).toHaveText('replay');
  const box = await frame.boundingBox();
  expect(box && box.width >= 300 && box.height >= 187).toBe(true);
  expect(requests).toBe(1);
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('the Kubb gadget keeps its link when the embed cannot be reached', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/things/kubb-throwing-wood/');
  const gadget = page.locator('[data-kubb-replay]');
  await gadget.scrollIntoViewIfNeeded();
  await expect(gadget).toBeVisible();
  await expect(gadget.locator('iframe')).toHaveCount(1);
  await expect(gadget.getByRole('link', { name: 'Open it on kubb.thingelstad.xyz' })).toBeVisible();
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});
