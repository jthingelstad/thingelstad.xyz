import { test, expect, type Page } from '@playwright/test';
import { fitsViewport, offline, watchErrors } from './helpers';

// Your Version Number's gadget is arithmetic in the browser (site/js/gadgets/your-version-number.js), so the test
// fixes the clock and the time zone and checks the numbers against ones worked out by hand, independently of the
// script: noon on Thursday, November 12, 2026, in Minneapolis.
test.use({ timezoneId: 'America/Chicago' });
test.beforeEach(async ({ page }) => {
  await offline(page);
  await page.clock.setFixedTime(new Date('2026-11-12T12:00:00-06:00'));
});

const open = async (page: Page) => {
  await page.goto('/things/your-version-number/');
  const gadget = page.locator('[data-yvn]');
  await expect(gadget).toBeVisible();
  return {
    gadget,
    birthday: gadget.locator('[data-yvn-birthday]'),
    start: gadget.locator('[data-yvn-start]'),
    life: gadget.locator('[data-yvn-result="birthday"]'),
    work: gadget.locator('[data-yvn-result="work"]')
  };
};

test('the version number gadget opens on the site’s own number and works out a birthday’s', async ({ page }) => {
  const errors = watchErrors(page);
  const { gadget, birthday, life } = await open(page);
  // The site went live on May 1, 2026: 195 days before November 12.
  await expect(life.locator('[data-yvn-number]')).toHaveText('0.0.195');
  // January 15, 1974: 52 on January 15, 2026, and 301 days since.
  await birthday.fill('1974-01-15');
  await expect(life.locator('[data-yvn-number]')).toHaveText('5.2.301');
  await expect(life.locator('[data-yvn-says]')).toHaveText(
    '5 decades, 2 years into this one, 301 days since the last birthday.'
  );
  await expect(gadget.locator('[data-yvn-open]')).toHaveAttribute(
    'href',
    'https://yourversionnumber.com/birthday/?p=1974-01-15'
  );
  // February 29, 2000: in 2026 the birthday falls on March 1, as on the site; 26 years, 256 days.
  await birthday.fill('2000-02-29');
  await expect(life.locator('[data-yvn-number]')).toHaveText('2.6.256');
  // A birthday today is patch zero.
  await birthday.fill('1976-11-12');
  await expect(life.locator('[data-yvn-number]')).toHaveText('5.0.0');
  await expect(life.locator('[data-yvn-says]')).toContainText('today is the birthday');
  // Tomorrow has no number yet.
  await birthday.fill('2026-11-13');
  await expect(life.locator('[data-yvn-number]')).toHaveText('');
  await expect(life.locator('[data-yvn-says]')).toHaveText('That’s in the future. Version numbers only count up.');
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('the version number gadget works out the Work Edition’s years, quarter, business days and build', async ({
  page
}) => {
  const errors = watchErrors(page);
  const { gadget, start, work } = await open(page);
  await expect(work.locator('[data-yvn-number]')).toHaveText('');
  // September 3, 2019: seven years on September 3, 2026, still in the first quarter (the second begins December 3),
  // 50 business days since September 3 (ten whole weeks), and 1,877 business days in all.
  await start.fill('2019-09-03');
  await expect(work.locator('[data-yvn-number]')).toHaveText('7.1.50+1,877');
  await expect(gadget.locator('[data-yvn-open]')).toHaveAttribute(
    'href',
    'https://yourversionnumber.com/work/edition/?j=2019-09-03'
  );
  // August 31, 2024: three months on is "November 31", which rolls to December 1, so still quarter 1: 53 business
  // days since August 31, 2026, and 574 in all.
  await start.fill('2024-08-31');
  await expect(work.locator('[data-yvn-number]')).toHaveText('2.1.53+574');
  // A year ago today: one year, the first day of the new year, and 261 business days (52 weeks and a Thursday).
  await start.fill('2025-11-12');
  await expect(work.locator('[data-yvn-number]')).toHaveText('1.1.0+261');
  await start.fill('2027-01-04');
  await expect(work.locator('[data-yvn-says]')).toHaveText(
    'That start date is in the future. Tenure is not accrued in advance.'
  );
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});
