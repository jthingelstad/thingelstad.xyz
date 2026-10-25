import { test, expect, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { llmsShapeProblems } from '../llms-shape';

type Thing = {
  id: string;
  title: string;
  summary: string;
  collection: string;
  page: string;
  started?: string | null;
  ended?: string | null;
  body?: string;
  status: string;
  topics: string[];
  sources: { kind: string }[];
  artifacts?: { file: string; url: string; preview?: string }[];
};
type Output = {
  featured: string[];
  things: Thing[];
  topics: { id: string; title: string }[];
  history: { id: string; title: string }[];
};
const { featured, things, topics, history } = JSON.parse(readFileSync('_site/things.json', 'utf8')) as Output;
type SharedSite = { id: string; strip_label: string; url: string; in_sites_strip: boolean };
type Owner = { name: string; url: string; avatar: string; note: string; rel_me: string[] };
const shared = JSON.parse(readFileSync('data/sites.json', 'utf8')) as { owner: Owner; sites: SharedSite[] };
const stripSites = shared.sites.filter((site) => site.in_sites_strip);
// The strip contract's colour marks (thingelstad.com AGENTS.md, "The sites strip"); the blog stays ink.
const stripColours = {
  www: 'rgb(22, 22, 26)',
  weekly: 'rgb(26, 94, 182)',
  another: 'rgb(179, 18, 63)',
  thingy: 'rgb(181, 70, 26)',
  xyz: 'rgb(29, 115, 72)'
};
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

test('the featured shelf leads the front page, its links measured where Tinylytics counts the site', async ({
  page
}, testInfo) => {
  await page.goto('/');
  const cards = page.locator('.featured .feature');
  const titles = featured.map((id) => things.find((thing) => thing.id === id)!.title);
  await expect(cards.locator('h3')).toHaveText(titles);
  const shelf = await page.locator('.featured').boundingBox();
  const index = await page.locator('.collection').first().boundingBox();
  expect(shelf!.y).toBeLessThan(index!.y);
  const links = await cards.evaluateAll((items) =>
    items.map((item) => ({
      visit: item.querySelector('.feature-visit')?.getAttribute('href') ?? null,
      cover: item.querySelector('.feature-cover')!.getAttribute('href')
    }))
  );
  const refs = links.map((link) => link.visit && new URL(link.visit).searchParams.get('ref'));
  expect(refs).toContain('xyz-featured');
  for (const [i, link] of links.entries()) {
    expect(refs[i] === null || refs[i] === 'xyz-featured', link.visit!).toBe(true);
    if (link.visit && new URL(link.visit).hostname === 'github.com') expect(refs[i]).toBeNull();
    expect(new URL(link.cover!).searchParams.get('ref')).toBe(refs[i]);
  }
  // Three to a row on a wide screen (five: the first two lead a row of their own); a list on a phone, each
  // small cover beside its card's words. Either way the page never scrolls sideways.
  const covers = await cards
    .locator('.feature-cover')
    .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().toJSON() as DOMRect));
  const words = await cards
    .locator('h3')
    .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().toJSON() as DOMRect));
  if (testInfo.project.name === 'desktop') {
    if (featured.length === 5) expect(covers[0].width).toBeGreaterThan(covers[2].width * 1.3);
    expect(covers[0].y).toBe(covers[1].y);
  } else if (testInfo.project.name === 'phone')
    for (const [i, cover] of covers.entries()) expect(cover.right).toBeLessThanOrEqual(words[i].left);
  expect(await fitsViewport(page)).toBe(true);
  await cards.locator('h3 a').first().click();
  await expect(page).toHaveURL(new RegExp(`/things/${featured[0]}/$`));
});

test('every page opens with the sites strip, this site current', async ({ page }) => {
  const errors = watchErrors(page);
  const phone = page.viewportSize()!.width <= 640;
  for (const [path, status] of [
    ['/', 200],
    ['/things/weekly-thing/', 200],
    ['/things/nothing-here/', 404]
  ] as const) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(status);
    const strip = page.getByRole('navigation', { name: 'Jamie Thingelstad' });
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
    await expect(current).toHaveText('Projects');
    await expect(strip.locator('.sites-strip__item--current')).toHaveClass(/\bsites-strip__item--xyz\b/);
    await expect(strip).toHaveCSS('background-color', 'rgb(243, 243, 245)');
    for (const [id, color] of Object.entries(stripColours)) {
      await expect(strip.locator(`.sites-strip__item--${id} a`), `${path}: ${id}`).toHaveCSS('color', color);
    }
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

// Dark follows the system setting. The strip takes the contract's dark values, the --jt-*-text colours.
const darkStripColours = {
  www: 'rgb(236, 236, 240)',
  weekly: 'rgb(120, 172, 242)',
  another: 'rgb(245, 138, 163)',
  thingy: 'rgb(243, 162, 116)',
  xyz: 'rgb(116, 211, 160)'
};

test('dark mode follows the system: a dark paper, light ink, and the strip in its dark values', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  for (const path of ['/', '/things/mb/', '/search/', '/activity/']) {
    await page.goto(path);
    await expect(page.locator('html'), path).toHaveCSS('background-color', 'rgb(23, 21, 18)');
    await expect(page.locator('html'), path).toHaveCSS('color', 'rgb(236, 231, 220)');
    const strip = page.getByRole('navigation', { name: 'Jamie Thingelstad' });
    await expect(strip).toHaveCSS('background-color', 'rgb(30, 30, 35)');
    for (const [id, color] of Object.entries(darkStripColours)) {
      await expect(strip.locator(`.sites-strip__item--${id} a`), `${path}: ${id}`).toHaveCSS('color', color);
    }
  }
  await expect(page.locator('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]')).toHaveAttribute(
    'content',
    '#171512'
  );
  await page.goto('/search/');
  await expect(page.locator('#search-input, .search-row input').first()).toHaveCSS(
    'background-color',
    'rgb(15, 14, 12)'
  );
});

test('the header links keep to one row at every width, scrolling only below 350px', async ({ page }) => {
  await page.goto('/search/');
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1536, 820, 500, 430, 390, 375, 360, 320]) {
    await page.setViewportSize({ width, height: 800 });
    const nav = await page.evaluate(() => {
      const nav = document.querySelector('.site-header nav')!;
      const tops = [...nav.querySelectorAll('a')].map((a) => Math.round(a.getBoundingClientRect().top));
      return { rows: new Set(tops).size, overflow: nav.scrollWidth - nav.clientWidth };
    });
    expect(nav.rows, `${width}px: one row`).toBe(1);
    if (width >= 350) expect(nav.overflow, `${width}px: every link fits`).toBeLessThanOrEqual(0);
    expect(await fitsViewport(page), `${width}px`).toBe(true);
  }
});

test('the favicon is the green T, versioned by its content', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('head link[rel="icon"]').getAttribute('href');
  expect(href).toMatch(/^\/favicon\.svg\?v=[0-9a-f]{10}$/);
  const icon = await page.request.get(href!);
  expect(icon.ok()).toBe(true);
  expect(icon.headers()['content-type']).toBe('image/svg+xml');
  const svg = await icon.body();
  expect(svg.toString()).toContain('fill="#1d7348"');
  expect(createHash('sha256').update(svg).digest('hex').slice(0, 10)).toBe(href!.split('?v=')[1]);
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
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
  // A page that is no thing's own shares this site's front page.
  for (const path of ['/', '/activity/', '/topics/']) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:image"]'), path).toHaveAttribute(
      'content',
      /^https:\/\/thingelstad\.xyz\/assets\/screenshots\/thingelstad-xyz-[0-9a-f]{10}\.jpg$/
    );
  }
  expect(errors).toEqual([]);
});

test('a thing’s artifacts are shown, linked, and served as the files they are', async ({ page, request }) => {
  const errors = watchErrors(page);
  const { artifacts } = things.find((thing) => thing.id === 'velotweets')!;
  await page.goto('/things/velotweets/');
  await expect(page.locator('.artifacts h2')).toHaveText('Artifacts');
  await expect(page.locator('.artifact')).toHaveCount(artifacts!.length);
  // An image is shown as itself; a file a browser cannot show, by its preview; a file with neither, by its name.
  const shown = artifacts!.filter((a) => /\.(png|jpe?g|gif|webp)$/.test(a.file) || a.preview);
  const images = page.locator('.artifact-image img');
  await expect(images).toHaveCount(shown.length);
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
      .toBeGreaterThan(0);
    const box = await image.evaluate((img) => {
      const frame = img.parentElement!.getBoundingClientRect();
      const own = img.getBoundingClientRect();
      return { fits: own.width <= frame.width && own.height <= frame.height, alt: img.getAttribute('alt') };
    });
    expect(box.fits).toBe(true);
    expect(box.alt).toBeTruthy();
  }
  const downloads = page.locator('.artifact-meta a[download]');
  await expect(downloads).toHaveCount(artifacts!.length);
  for (const [i, artifact] of artifacts!.entries()) {
    const href = await downloads.nth(i).getAttribute('href');
    expect(href).toBe(new URL(artifact.url).pathname);
    const response = await request.get(href!);
    expect(response.status(), href!).toBe(200);
    expect(response.headers()['content-type'], href!).toBe(
      artifact.file.endsWith('.png')
        ? 'image/png'
        : artifact.file.endsWith('.zip')
          ? 'application/zip'
          : 'application/octet-stream'
    );
  }
  expect(await fitsViewport(page)).toBe(true);
  await page.goto('/things/elixir-bot/');
  await expect(page.locator('.artifacts')).toHaveCount(0);
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
    '/activity.xml',
    '/llms.txt',
    '/llms-full.txt',
    '/things.json',
    '/things/weekly-thing.md'
  ]) {
    const response = await page.request.get(path);
    expect(response.ok(), path).toBe(true);
  }
  // llms.txt as the llmstxt.org reference parser reads it: prose only above the first heading (tests/llms-shape.ts).
  const llms = await page.request.get('/llms.txt');
  expect(llmsShapeProblems(await llms.text())).toEqual([]);
  const missing = await page.request.get('/things/nothing-here/');
  expect(missing.status()).toBe(404);
  expect(errors).toEqual([]);
});

test('activity shows who made the commits, week by week, and each thing keeps its own', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/activity/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Activity');
  await expect(page.locator('.site-header nav a[aria-current="page"]')).toHaveText('Activity');
  const years = page.locator('.who-years > li');
  expect(await years.count()).toBeGreaterThan(1);
  await expect(years.first().locator('svg.who-bar')).toHaveAttribute('aria-label', /^\d{4}: /);
  await expect(page.locator('.activity-years .who-legend')).toContainText('With an agent');
  await expect(page.locator('.week')).toHaveCount(12);
  const week = page.locator('.week').first();
  await expect(week).toHaveAttribute('id', /^w-\d{4}-\d{2}-\d{2}$/);
  await expect(week.locator('h3')).toContainText('so far');
  expect(await fitsViewport(page)).toBe(true);
  const entry = page.locator('.activity-entry .activity-thing').first();
  const title = (await entry.innerText()).trim();
  await entry.click();
  await expect(page.locator('.thing-activity h2')).toHaveText('Activity');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(title);
  await page.goto('/things/jamie-thingelstad-blog/');
  await expect(page.locator('.thing-activity .year-chart svg')).toHaveAttribute('aria-label', /commits per year from/);
  const recent = page.locator('.thing-activity a.activity-week').first();
  const anchor = (await recent.getAttribute('href'))!;
  expect(anchor).toMatch(/^\/activity\/#w-\d{4}-\d{2}-\d{2}$/);
  await recent.click();
  await expect(page.locator(anchor.slice('/activity/'.length))).toBeInViewport();
  const feed = await page.request.get('/activity.xml');
  expect(feed.ok()).toBe(true);
  expect(await feed.text()).toContain('<guid isPermaLink="false">activity-');
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
    // The u-photo stops mf2 parsers implying a url from the href, so the card names it.
    await expect(card.locator('data.u-url')).toHaveAttribute('value', owner.url);
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

// The microformats on a page an mf2 parser reads as roots or as a feed's children (h-card, h-entry, h-feed, ...):
// every h-* class except on a property's value, which here is only an entry's p-author h-card.
const microformatRoots = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[class]')]
      .filter((element) => ![...element.classList].some((name) => /^(p|u|dt|e)-/.test(name)))
      .flatMap((element) => [...element.classList].filter((name) => /^h-[a-z]+(-[a-z]+)*$/.test(name)))
  );
// What each entry says beyond its name, url and summary: its author, the owner's hidden h-card with the clean
// identity URL, and no dt-* date (a thing's dates are when it started and ended, not when it was published).
const entryExtras = (entries: Element[]) =>
  entries.map((entry) => ({
    author: [...entry.querySelectorAll('.h-card')].map((card) => ({
      property: card.classList.contains('p-author') && card.parentElement === entry,
      url: card.getAttribute('href'),
      name: card.textContent!.trim(),
      shown: card.checkVisibility()
    })),
    dates: [...entry.querySelectorAll('[class]')].flatMap((element) =>
      [...element.classList].filter((name) => name.startsWith('dt-'))
    )
  }));
const ownerAuthor = { author: [{ property: true, url: owner.url, name: owner.name, shown: false }], dates: [] };

test('a thing page is one h-entry: its title, canonical address, author, summary and story', async ({ page }) => {
  for (const thing of things) {
    const path = new URL(thing.page).pathname;
    await page.goto(path);
    // The entry and the footer's h-card, nothing else, and neither inside the other.
    expect((await microformatRoots(page)).toSorted(), path).toEqual(['h-card', 'h-entry']);
    const entry = page.locator('article.h-entry');
    await expect(page.locator('.h-card .h-entry'), path).toHaveCount(0);
    expect(await entry.evaluateAll(entryExtras), path).toEqual([ownerAuthor]);
    await expect(entry.locator('.p-name'), path).toHaveText(thing.title);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical, path).toBe(thing.page);
    await expect(entry.locator('.u-url'), path).toHaveCount(1);
    await expect(entry.locator('data.u-url'), path).toHaveAttribute('value', canonical!);
    // The dates the page shows stay, as the record gives them.
    for (const date of [thing.started, thing.ended].filter(Boolean))
      await expect(entry.locator(`.facts time[datetime="${date}"]`), path).toBeVisible();
    await expect(entry.locator('.p-summary'), path).toHaveText(thing.summary);
    await expect(entry.locator('.e-content'), path).toHaveCount(thing.body?.trim() ? 1 : 0);
  }
});

test('every list of things is an h-feed of h-entries, one level deep', async ({ page }) => {
  const byPath = new Map(things.map((thing) => [new URL(thing.page).pathname, thing]));
  const collections = [...new Set(things.map((thing) => thing.collection))];
  await page.goto('/');
  const siteTitle = await page.title(); // the front page's title is the site's own
  const lists = [
    { path: '/', feeds: ['Featured', ...collections], entries: featured.length + things.length },
    { path: '/search/', feeds: [siteTitle], entries: things.length },
    {
      path: '/topics/agents/',
      feeds: [topics.find((topic) => topic.id === 'agents')!.title],
      entries: things.filter((thing) => thing.topics.includes('agents')).length
    }
  ];
  for (const list of lists) {
    await page.goto(list.path);
    expect(new Set(await microformatRoots(page)), list.path).toEqual(new Set(['h-card', 'h-feed', 'h-entry']));
    const shape = await page.evaluate(() => ({
      // An entry's author is its one h-card, a property; any other microformat inside an entry or feed is nested.
      nested: document.querySelectorAll(
        '.h-entry .h-entry, .h-entry .h-feed, .h-feed .h-feed, .h-feed .h-card:not(.h-entry > .p-author)'
      ).length,
      loose: [...document.querySelectorAll('.h-entry')].filter((entry) => !entry.closest('.h-feed')).length,
      plain: document.querySelectorAll('.thing-row:not(.h-entry), .feature:not(.h-entry)').length,
      // Each feed's name: its one p-name outside its entries.
      feeds: [...document.querySelectorAll('.h-feed')].map((feed) =>
        [...feed.querySelectorAll('.p-name')]
          .filter((name) => !name.closest('.h-entry'))
          .map((name) => name.getAttribute('value') ?? name.textContent!.trim())
      )
    }));
    expect(shape.nested, `${list.path}: nothing inside an entry or another feed`).toBe(0);
    expect(shape.loose, `${list.path}: every entry is in a feed`).toBe(0);
    expect(shape.plain, `${list.path}: every row and card is an entry`).toBe(0);
    expect(
      shape.feeds.every((names) => names.length === 1),
      `${list.path}: each feed has one name`
    ).toBe(true);
    expect(shape.feeds.flat().toSorted(), list.path).toEqual(list.feeds.toSorted());
    const entries = await page.locator('.h-entry').evaluateAll((items) =>
      items.map((item) => ({
        name: [...item.querySelectorAll('.p-name')].map((element) => element.textContent!.trim()),
        url: [...item.querySelectorAll('.u-url')].map((element) => element.getAttribute('href')!),
        summary: [...item.querySelectorAll('.p-summary')].map((element) => element.textContent!.trim())
      }))
    );
    expect(entries, list.path).toHaveLength(list.entries);
    for (const entry of entries) {
      const thing = byPath.get(entry.url[0])!;
      expect(thing, `${list.path}: ${entry.url[0]}`).toBeTruthy();
      expect(entry, list.path).toEqual({
        name: [thing.title],
        url: [new URL(thing.page).pathname],
        summary: [thing.summary]
      });
    }
    for (const extras of await page.locator('.h-entry').evaluateAll(entryExtras))
      expect(extras, list.path).toEqual(ownerAuthor);
  }
});

test('each feed is served as the type its head link names, and the sitemap lists every page', async ({ page }) => {
  // The local server sends each file with the type the publish gives it (scripts/publish-plan.mjs).
  await page.goto('/things/weekly-thing/');
  const alternates = await page
    .locator('head link[rel="alternate"]')
    .evaluateAll((links) =>
      links.map((link) => ({ type: link.getAttribute('type')!, href: link.getAttribute('href')! }))
    );
  expect(alternates.map((link) => link.href)).toEqual([
    '/feed.xml',
    '/feed.json',
    '/activity.xml',
    '/things/weekly-thing.md'
  ]);
  for (const { type, href } of alternates) {
    const response = await page.request.get(href);
    expect(response.ok(), href).toBe(true);
    expect(response.headers()['content-type'], href).toBe(`${type}; charset=utf-8`);
  }
  expect(alternates.map((link) => link.type)).toEqual([
    'application/rss+xml',
    'application/feed+json',
    'application/rss+xml',
    'text/markdown'
  ]);
  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.headers()['content-type']).toBe('application/xml; charset=utf-8');
  const pages = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
  expect(new Set(pages).size, 'each page once').toBe(pages.length);
  // Every page the header links (search among them), every thing, every topic.
  const header = await page
    .locator('.site-header nav a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')!));
  expect(header).toContain('/search/');
  for (const path of [
    ...header,
    ...things.map((thing) => new URL(thing.page).pathname),
    ...topics.map((topic) => `/topics/${topic.id}/`)
  ])
    expect(pages, path).toContain(path);
});

test('links to the other sites carry a ref, and story text keeps its links', async ({ page }) => {
  await page.goto('/things/weekly-thing/');
  const where = page.locator('.facts').getByRole('link', { name: 'weekly.thingelstad.com/' });
  await expect(where).toHaveAttribute('href', 'https://weekly.thingelstad.com/?ref=xyz-thing');
  await expect(page.locator('.screenshot a')).toHaveAttribute('href', 'https://weekly.thingelstad.com/?ref=xyz-thing');
  for (const path of [
    '/',
    '/things/weekly-thing/',
    '/things/jamie-thingelstad-blog/',
    '/things/thingy/',
    '/history/',
    '/activity/'
  ]) {
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
      else expect(ref, `${path}: ${link.href}`).toMatch(/^xyz-(thing|source|activity|featured)$/);
    }
  }
});

test('the shared type: Inter Tight headings, Inter text, nothing under 14px, no design italics, one frame', async ({
  page,
  baseURL
}) => {
  const errors = watchErrors(page);
  const fonts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'font') fonts.push(request.url());
  });
  const width = page.viewportSize()!.width;
  const phone = width <= 640;
  for (const [path, status] of [
    ['/', 200],
    ['/things/thingy/', 200],
    ['/things/elixir-bot/', 200],
    ['/things/velotweets/', 200],
    ['/things/yearly-thing-2025/', 200],
    ['/topics/', 200],
    ['/history/', 200],
    ['/timeline/', 200],
    ['/activity/', 200],
    ['/search/?q=wiki', 200],
    ['/things/nothing-here/', 404]
  ] as const) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(status);
    if (path.startsWith('/search/')) await expect(page.locator('.search-excerpt').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const type = await page.evaluate(() => {
      const describe = (el: Element) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`;
      const small: string[] = [];
      const italic: string[] = [];
      for (const el of document.querySelectorAll('body *')) {
        const own = [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim());
        if (!own || !el.getBoundingClientRect().width) continue;
        const style = getComputedStyle(el);
        if (parseFloat(style.fontSize) < 14) small.push(`${describe(el)} ${style.fontSize}`);
        // Content text (a thing's story, Jamie's own Markdown) keeps its emphasis; the design never slants.
        if (style.fontStyle !== 'normal' && !el.closest('.story')) italic.push(describe(el));
      }
      const h1 = getComputedStyle(document.querySelector('h1')!);
      // Where each band's content starts: the strip, header, main column and footer share one left edge.
      const edges = ['.sites-strip__inner', '.site-header', '.site-main', '.site-footer'].map((selector) => {
        const el = document.querySelector(selector)!;
        return el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).paddingLeft);
      });
      const main = document.querySelector('.site-main')!;
      const mainStyle = getComputedStyle(main);
      return {
        small,
        italic,
        h1: { family: h1.fontFamily, weight: h1.fontWeight, tracking: h1.letterSpacing },
        body: { family: getComputedStyle(document.body).fontFamily, size: getComputedStyle(document.body).fontSize },
        loaded: [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family),
        edges,
        column: main.clientWidth - parseFloat(mainStyle.paddingLeft) - parseFloat(mainStyle.paddingRight)
      };
    });
    expect(type.small, `${path}: text under 14px`).toEqual([]);
    expect(type.italic, `${path}: italics outside content`).toEqual([]);
    expect(type.h1.family, path).toMatch(/^"Inter Tight", Inter,/);
    expect(type.h1.weight, path).toBe('800');
    expect(type.body.family, path).toMatch(/^Inter,/);
    expect(type.body.size, path).toBe(phone ? '18px' : '19px');
    expect(type.loaded, path).toEqual(expect.arrayContaining(['Inter', 'Inter Tight']));
    expect(new Set(type.edges).size, `${path}: one left edge`).toBe(1);
    // The shared frame: 1120px less its 24px gutters, or the viewport less its gutters.
    expect(type.column, path).toBe(Math.min(1120, width) - (phone ? 32 : 48));
    expect(await fitsViewport(page), path).toBe(true);
  }
  expect(fonts.length).toBeGreaterThan(0);
  for (const url of fonts) expect(url).toMatch(new RegExp(`^${baseURL}/assets/shared-[0-9a-f]{10}/fonts/inter-`));
  expect(errors).toEqual([]);
});

test('search narrows the list by its words and facets, and keeps them in the address', async ({ page }) => {
  const errors = watchErrors(page);
  const phone = page.viewportSize()!.width < 900;
  const rows = page.locator('.thing-row:visible');
  const status = page.locator('[data-search-status]');
  const chip = (facet: string, value: string) => page.locator(`[data-facet="${facet}"] button[data-value="${value}"]`);
  const count = async (facet: string, value: string) =>
    Number(await chip(facet, value).locator('[data-count]').textContent());
  await page.goto('/search/');
  await expect(status).toHaveText(`All ${things.length} things`);
  await expect(rows).toHaveCount(things.length);
  // The filters sit beside the list on a wide screen and fold into a button on a narrow one.
  const filters = page.locator('[data-search-facets]');
  await expect(filters).toHaveJSProperty('open', !phone);
  if (phone) await filters.locator('summary').click();
  expect(await fitsViewport(page)).toBe(true);

  // Words: each match shows the passage that matched in place of its summary.
  await page.getByRole('searchbox').fill('wiki');
  await expect(status).toContainText(`of ${things.length} things match “wiki”`);
  await expect(page).toHaveURL(/\/search\/\?q=wiki$/);
  const matches = await rows.count();
  expect(matches).toBeGreaterThan(1);
  expect(matches).toBeLessThan(things.length);
  await expect(rows.locator('.search-excerpt mark')).not.toHaveCount(0);
  await expect(rows.locator('.search-excerpt')).toHaveCount(matches);
  await expect(rows.locator('.thing-summary:visible')).toHaveCount(0);

  // A choice shows as many things as its count said, and the other counts follow.
  const retired = await count('status', 'retired');
  expect(retired).toBeGreaterThan(0);
  await chip('status', 'retired').click();
  await expect(chip('status', 'retired')).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/\?q=wiki&status=retired$/);
  await expect(rows).toHaveCount(retired);
  await expect(page.locator('.thing-row.is-retired:visible')).toHaveCount(retired);
  // A facet is counted without its own choice, so Retired keeps its count and the other statuses say what they add.
  expect(await count('status', 'retired')).toBe(retired);
  expect(await count('status', 'active')).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(rows).toHaveCount(things.length);
  await expect(page).toHaveURL(/\/search\/$/);

  // Pagefind shortens a word it does not know until something matches; a nonsense word matches nothing here.
  await page.getByRole('searchbox').fill('avatars');
  await expect(status).toHaveText('Nothing I’ve built matches “avatars”.');
  await expect(rows).toHaveCount(0);

  // The address carries a search: Python things, newest first, and a bar of the histogram adds a year.
  await page.goto('/search/?language=python&sort=newest');
  const python = await count('language', 'python');
  await expect(rows).toHaveCount(python);
  await expect(page.getByRole('combobox', { name: 'Sort' })).toHaveValue('newest');
  const started = await rows.evaluateAll((items) => items.map((item) => (item as HTMLElement).dataset.started ?? ''));
  expect(started.filter(Boolean)).toEqual(started.filter(Boolean).toSorted().reverse());
  // Filters from the address open the panel on any screen.
  await expect(filters).toHaveJSProperty('open', true);
  const year = page.locator('[data-facet="year"] button.bar:not(:disabled)').last();
  const value = (await year.getAttribute('data-value'))!;
  await year.click();
  await expect(page).toHaveURL(new RegExp(`\\?year=${value}&language=python&sort=newest$`));
  await expect(rows).not.toHaveCount(0);
  for (const when of await rows.evaluateAll((items) => items.map((item) => (item as HTMLElement).dataset.started)))
    expect(when).toMatch(new RegExp(`^${value}`));
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('the legend on the front page leads to search, filtered by status', async ({ page }) => {
  await page.goto('/');
  await page.locator('.legend a.status-dormant').click();
  await expect(page).toHaveURL(/\/search\/\?status=dormant$/);
  const dormant = things.filter((thing) => thing.status === 'dormant').length;
  await expect(page.locator('.thing-row:visible')).toHaveCount(dormant);
  await expect(page.locator('[data-facet="status"] button[data-value="dormant"]')).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the search page still lists every thing', async ({ page }) => {
    await page.goto('/search/');
    await expect(page.locator('.thing-row:visible')).toHaveCount(things.length);
    await expect(page.locator('[data-search-status]')).toContainText('Every thing I’ve built is listed below.');
    await expect(page.getByRole('searchbox')).toBeHidden();
    await expect(page.locator('[data-search-facets]')).toBeHidden();
  });
});
