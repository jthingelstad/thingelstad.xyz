import { test, expect, type Page } from '@playwright/test';
import { fitsViewport, offline, watchErrors } from './helpers';

test.beforeEach(({ page }) => offline(page));

// Linking Things' gadget reads its day files from the browser (site/js/gadgets/linking-things.js). Tests never reach
// them: blocked, the gadget says so; answered here, it lists earlier years' links with ref'd links and their years,
// shows a note only where its voice is Jamie's, and draws a random link from the links Surprise me would.
const SITE = 'https://links.thingelstad.xyz';
const NOON = new Date('2026-11-12T18:00:00Z'); // noon on November 12 in Minnesota

type Voice = 'jamie' | 'mixed' | 'excerpt' | 'agent' | null;
const link = (id: string, day: string, voice: Voice, note = '', issues: number[] = []) => ({
  id,
  title: `Link ${id}`,
  url: `https://example.com/${id}`,
  note,
  voice,
  saved: `${day}T15:00:00Z`,
  day,
  record: `${SITE}/links/${id}/`,
  json: `${SITE}/links/${id}.json`,
  issues: issues.map((number) => ({ number, title: `WT${number}`, page: `${SITE}/issues/${number}/` }))
});
const dayFile = (key: string, label: string, links: ReturnType<typeof link>[]) => ({
  day: key,
  label,
  page: `${SITE}/on/${key}/`,
  count: links.length,
  links
});

const serve = async (page: Page, files: Record<string, unknown>) => {
  const requests: string[] = [];
  await page.route(`${SITE}/on/*.json`, (route) => {
    const key = /\/on\/(\d\d-\d\d)\.json$/.exec(route.request().url())?.[1] ?? '';
    requests.push(key);
    return files[key]
      ? route.fulfill({ contentType: 'application/json', json: files[key] })
      : route.fulfill({ status: 404, body: '' });
  });
  return requests;
};

test('the Linking Things gadget says so when Linking Things cannot be reached', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/things/linking-things/');
  const gadget = page.locator('[data-links-gadget]');
  await expect(gadget).toBeVisible();
  await expect(gadget.locator('[data-links-status]')).toContainText('could not be reached');
  await expect(gadget.locator('[data-links-day] li')).toHaveCount(0);
  await gadget.locator('[data-links-random]').click();
  await expect(gadget.locator('[data-links-pick]')).toContainText('could not be reached');
  await expect(gadget.locator('[data-links-random]')).toBeEnabled();
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('the Linking Things gadget lists earlier years and shows only Jamie’s notes as his', async ({ page }) => {
  const errors = watchErrors(page);
  await page.clock.setFixedTime(NOON);
  await page.addInitScript(() => {
    Math.random = () => 0; // the random link reads 01-01, the first day, and takes its first candidate
  });
  const long = `See [this piece](https://example.com/x) about **links**. ${'More words here. '.repeat(20)}`;
  const requests = await serve(page, {
    '11-12': dayFile('11-12', 'November 12', [
      link('a2026', '2026-11-12', 'jamie', 'Saved today, not an earlier year.'),
      link('a2025', '2025-11-12', 'jamie', long),
      link('b2019', '2019-11-12', 'excerpt', '> The page’s own words.', [120]),
      link('a2019', '2019-11-12', 'jamie', 'Short and his.'),
      link('a2010', '2010-11-12', 'agent', 'An agent summary.'),
      link('a2008', '2008-11-12', 'mixed', 'His words.\n\n> The page’s words.')
    ]),
    '01-01': dayFile('01-01', 'January 1', [
      link('e2012', '2012-01-01', 'excerpt', '> Quoted from the page.'),
      link('j2015', '2015-01-01', 'jamie', 'A note of his own.')
    ])
  });
  await page.goto('/things/linking-things/');
  const gadget = page.locator('[data-links-gadget]');
  const status = gadget.locator('[data-links-status]');
  await expect(status).toContainText('5 links were saved on November 12 in 4 earlier years.');
  await expect(status.locator('a')).toHaveAttribute('href', `${SITE}/on/11-12/?ref=xyz-gadget`);

  const items = gadget.locator('[data-links-day] > li');
  await expect(items).toHaveCount(4);
  await expect(items.locator('.links-year')).toHaveText(['2025', '2019', '2010', '2008']);
  await expect(items.nth(0).locator('a')).toHaveAttribute('href', `${SITE}/links/a2025/?ref=xyz-gadget`);
  // A long note is one plain line, cut with an ellipsis; Markdown marks and link targets go.
  const note = items.nth(0).locator('.links-note');
  await expect(note).toHaveText(/^See this piece about links\. More words here\..*…$/);
  expect((await note.textContent())!.length).toBeLessThanOrEqual(221);
  // In 2019 the link with Jamie's note comes first; the excerpt carried by an issue waits.
  await expect(items.nth(1).locator('a')).toHaveText('Link a2019');
  await expect(items.nth(1).locator('.links-note')).toHaveText('Short and his.');
  // An agent's note and a mixed note are not shown as his.
  await expect(items.nth(2).locator('.links-note')).toHaveCount(0);
  await expect(items.nth(3).locator('.links-note')).toHaveCount(0);
  await expect(gadget).not.toContainText(/agent summary|page’s words|Saved today/);

  await gadget.locator('[data-links-random]').click();
  const pick = gadget.locator('[data-links-pick] > li');
  await expect(pick).toHaveCount(1);
  await expect(pick.locator('a')).toHaveText('Link j2015');
  await expect(pick.locator('a')).toHaveAttribute('href', `${SITE}/links/j2015/?ref=xyz-gadget`);
  await expect(pick.locator('.links-year')).toHaveText('2015');
  await expect(pick.locator('.links-note')).toHaveText('A note of his own.');
  expect(requests).toEqual(['11-12', '01-01']);
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('the Linking Things gadget spreads a long day over six years, oldest to newest', async ({ page }) => {
  const errors = watchErrors(page);
  await page.clock.setFixedTime(NOON);
  const years = Array.from({ length: 21 }, (_, i) => 2005 + i); // 2005 to 2025
  await serve(page, {
    '11-12': dayFile(
      '11-12',
      'November 12',
      years.reverse().map((year) => link(`y${year}`, `${year}-11-12`, null))
    )
  });
  await page.goto('/things/linking-things/');
  const gadget = page.locator('[data-links-gadget]');
  await expect(gadget.locator('[data-links-status]')).toContainText(
    '21 links were saved on November 12 in 21 earlier years.'
  );
  await expect(gadget.locator('[data-links-day] .links-year')).toHaveText([
    '2025',
    '2021',
    '2017',
    '2013',
    '2009',
    '2005'
  ]);
  await expect(gadget.locator('.links-note')).toHaveCount(0);
  expect(errors).toEqual([]);
});
