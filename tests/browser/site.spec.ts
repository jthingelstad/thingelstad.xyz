import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Thing = { id: string; title: string; status: string; topics: string[]; sources: { kind: string }[] };
type Output = { things: Thing[]; topics: { id: string; title: string }[]; history: { id: string; title: string }[] };
const { things, topics, history } = JSON.parse(readFileSync('_site/things.json', 'utf8')) as Output;
type SharedSite = { id: string; strip_label: string; url: string; in_sites_strip: boolean };
type Owner = { name: string; url: string; avatar: string; note: string; rel_me: string[] };
const shared = JSON.parse(readFileSync('data/sites.json', 'utf8')) as { owner: Owner; sites: SharedSite[] };
const stripSites = shared.sites.filter((site) => site.in_sites_strip);
const { owner } = shared;
// The other strip sites, whose links from here carry ?ref=xyz-<placement>.
const sisterHosts = stripSites.filter((site) => site.id !== 'xyz').map((site) => new URL(site.url).hostname);

// Keep CI visits out of analytics. The embed is intercepted, never loaded.
let analyticsRequests = 0;
test.beforeEach(async ({ page }) => {
  analyticsRequests = 0;
  await page.route('https://tinylytics.app/**', (route) => {
    analyticsRequests++;
    return route.fulfill({ contentType: 'text/javascript', body: '' });
  });
  // Every page links Jamie's other sites in the sites strip; a test never loads a live one.
  await page.route(
    (url) => url.hostname !== '127.0.0.1' && url.hostname !== 'tinylytics.app',
    (route) => route.abort('blockedbyclient')
  );
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
  for (const status of ['active', 'dormant', 'retired', 'abandoned', 'archived']) {
    const count = things.filter((thing) => thing.status === status).length;
    await expect(page.locator(`.thing-row .status-${status}`)).toHaveCount(count);
  }
  expect(await fitsViewport(page)).toBe(true);
  await page.getByRole('main').getByRole('link', { name: 'Weekly Thing', exact: true }).first().click();
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

test('every page opens with the Jamie’s sites strip, this site current', async ({ page }) => {
  const errors = watchErrors(page);
  const phone = page.viewportSize()!.width <= 640;
  for (const [path, status] of [
    ['/', 200],
    ['/things/weekly-thing/', 200],
    ['/things/nothing-here/', 404]
  ] as const) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(status);
    const strip = page.getByRole('navigation', { name: "Jamie's sites" });
    await expect(strip).toBeVisible();
    expect(await page.evaluate(() => document.querySelector('body > .skip + *')?.className), path).toBe('sites-strip');
    const links = strip.getByRole('link');
    await expect(links).toHaveCount(stripSites.length);
    for (const [index, site] of stripSites.entries()) {
      await expect(links.nth(index)).toHaveAttribute('href', `${site.url}?ref=sites-strip-xyz`);
      await expect(links.nth(index)).toHaveText(site.strip_label);
    }
    const current = strip.locator('[aria-current="true"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText('Things I’ve built');
    await expect(strip.locator('.sites-strip__item--current')).toHaveClass(/\bsites-strip__item--xyz\b/);
    await expect(strip).toHaveCSS('background-color', 'rgb(243, 243, 245)');
    await expect(strip.locator('.sites-strip__label')).toBeVisible({ visible: !phone });
    const rows = await strip
      .locator('.sites-strip__item')
      .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top));
    if (phone) expect(new Set(rows).size, 'one row that scrolls sideways on a phone').toBe(1);
    expect((await strip.boundingBox())!.height).toBeGreaterThanOrEqual(40);
    expect(await fitsViewport(page), path).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('a website thing shows its front page and page views', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/things/r-w-book-club/');
  const shot = page.locator('.screenshot img');
  await shot.scrollIntoViewIfNeeded();
  await expect(shot).toHaveAttribute('alt', /^The front page of rwbookclub\.com on /);
  await expect.poll(() => shot.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBe(1280);
  await expect(page.locator('.screenshot a')).toHaveAttribute('href', 'https://rwbookclub.com/');
  await expect(page.locator('.facts .views')).toContainText('in the twelve months to');
  await expect(page.locator('.facts .views .sparkline-views')).toBeVisible();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /\/assets\/screenshots\/rwbookclub-com-[0-9a-f]{10}\.jpg$/
  );
  expect(await fitsViewport(page)).toBe(true);
  await page.goto('/things/elixir-bot/');
  await expect(page.locator('.screenshot')).toHaveCount(0);
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
  expect(errors).toEqual([]);
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
  await expect(page.locator('.tl-things > li')).toHaveCount(things.length);
  await expect(page.locator('.tl-year').first()).toHaveAttribute('id', `y${new Date().getUTCFullYear()}`);
  await expect(page.locator('.tl-things .lifespan').first()).toBeVisible();
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

test('every page names Jamie with the shared h-card and rel=me links', async ({ page }) => {
  for (const [path, status] of [
    ['/', 200],
    ['/things/weekly-thing/', 200],
    ['/things/nothing-here/', 404]
  ] as const) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(status);
    const card = page.locator('.site-footer a.h-card');
    await expect(card).toHaveCount(1);
    await expect(card, 'identity links stay clean').toHaveAttribute('href', owner.url);
    await expect(card).toHaveAttribute('rel', 'me author');
    await expect(card.locator('.p-name')).toHaveText(owner.name);
    await expect(card.locator('data.p-note')).toHaveAttribute('value', owner.note);
    const photo = card.locator('img.u-photo');
    await expect(photo).toHaveAttribute('src', owner.avatar);
    await expect(photo).toHaveAttribute('alt', '');
    await expect(photo).toHaveCSS('border-radius', '50%');
    const box = (await photo.boundingBox())!;
    expect([box.width, box.height]).toEqual([24, 24]);
    const name = (await card.locator('.p-name').boundingBox())!;
    expect(
      Math.abs(box.y + box.height / 2 - (name.y + name.height / 2)),
      'the photo sits beside the name'
    ).toBeLessThan(3);
    const relMe = await page
      .locator('head link[rel="me"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect(relMe).toEqual(owner.rel_me);
    expect(await fitsViewport(page), path).toBe(true);
  }
});

test('links to the other sites carry a ref, and story text keeps its links', async ({ page }) => {
  await page.goto('/things/weekly-thing/');
  const where = page.locator('.facts').getByRole('link', { name: 'weekly.thingelstad.com/' });
  await expect(where).toHaveAttribute('href', 'https://weekly.thingelstad.com/?ref=xyz-thing');
  await expect(page.locator('.screenshot a')).toHaveAttribute('href', 'https://weekly.thingelstad.com/?ref=xyz-thing');
  for (const path of ['/things/weekly-thing/', '/things/jamie-thingelstad-blog/', '/things/thingy/', '/history/']) {
    await page.goto(path);
    const links = await page.locator('a[href^="https://"]').evaluateAll((anchors) =>
      anchors.map((a) => ({
        href: a.getAttribute('href')!,
        story: Boolean(a.closest('.story')),
        strip: Boolean(a.closest('.sites-strip')),
        card: a.classList.contains('h-card')
      }))
    );
    for (const link of links) {
      const url = new URL(link.href);
      if (!sisterHosts.includes(url.hostname) || link.strip || link.card) continue;
      const ref = url.searchParams.get('ref');
      if (link.story) expect(ref, `${path}: story text is content`).toBeNull();
      // Feeds and sitemaps are files, not visits, and stay as the record has them.
      else if (/\.(xml|json)$/.test(url.pathname)) expect(ref, `${path}: ${link.href}`).toBeNull();
      else expect(ref, `${path}: ${link.href}`).toMatch(/^xyz-(thing|source)$/);
    }
  }
});
