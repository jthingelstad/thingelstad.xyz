import { test, expect } from '@playwright/test';
import { fitsViewport, offline, watchErrors } from './helpers';

test.beforeEach(({ page }) => offline(page));

// The Weekly Thing's gadget reads the newsletter's JSON Feed from the browser (site/js/gadgets/weekly-thing.js).
// Tests never reach it: blocked, the gadget says so; answered here, it names the latest issue with a ref'd link and
// fills the weeks an issue went out. It never says when the next issue goes out.
const feed = 'https://weekly.thingelstad.com/feed.json';
const DAY = 86_400_000;

test('the Weekly Thing gadget says so when the feed cannot be reached', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/things/weekly-thing/');
  const gadget = page.locator('[data-weekly-gadget]');
  await expect(gadget).toBeVisible();
  await expect(gadget.locator('[data-weekly-latest]')).toContainText('could not be reached');
  await expect(gadget.locator('.weekly-weeks li')).toHaveCount(52);
  await expect(gadget.locator('.weekly-weeks li.is-sent')).toHaveCount(0);
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('the Weekly Thing gadget names the latest issue and fills the weeks an issue went out', async ({ page }) => {
  const errors = watchErrors(page);
  // Saturday-morning sends, one a week for the last ten weeks, then a gap, then one more a year and a half ago.
  const now = Date.now();
  const issue = (number: number, daysAgo: number) => ({
    id: `https://weekly.thingelstad.com/archive/${number}/`,
    url: `https://weekly.thingelstad.com/archive/${number}/`,
    title: `WT${number} — Issue ${number}`,
    date_published: new Date(now - daysAgo * DAY).toISOString()
  });
  const items = [...Array.from({ length: 10 }, (_, i) => issue(400 - i, 3 + i * 7)), issue(300, 550)];
  let requests = 0;
  await page.route(feed, (route) => {
    requests++;
    return route.fulfill({
      contentType: 'application/json',
      json: { version: 'https://jsonfeed.org/version/1.1', items }
    });
  });
  await page.goto('/things/weekly-thing/');
  const gadget = page.locator('[data-weekly-gadget]');
  const latest = gadget.locator('[data-weekly-latest] a');
  await expect(latest).toHaveText('WT400 — Issue 400');
  await expect(latest).toHaveAttribute('href', 'https://weekly.thingelstad.com/archive/400/?ref=xyz-gadget');
  await expect(gadget.locator('[data-weekly-latest]')).toContainText(
    /went out on \w+day, \w+ \d+, \d{4}, 3 days ago\./
  );
  await expect(gadget.locator('.weekly-weeks li.is-sent')).toHaveCount(10);
  await expect(gadget.locator('.weekly-weeks li').last()).toHaveAttribute('title', /^Week of /);
  await expect(gadget.locator('[data-weekly-count]')).toHaveText('10 issues in the last 52 weeks.');
  await expect(gadget).not.toContainText(/next issue|countdown/i);
  expect(requests).toBe(1);
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});
