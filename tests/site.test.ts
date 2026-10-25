import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadRegistry } from '../collection/load';
import { loadObservations } from '../collection/observations';
import {
  buildSiteModel,
  formatDate,
  jsonFeed,
  llmsFullText,
  llmsText,
  rssFeed,
  rssItems,
  activityRss,
  screenshotAsset,
  siteUrl,
  sparkline,
  thingMarkdown,
  thingsJson,
  aliveBar,
  lifespan,
  toInstant,
  sticker,
  reach,
  reachThreshold
} from '../collection/site';
import { splitFrontmatter } from '../collection/load';
import {
  activitySummary,
  buildActivity,
  localDay,
  weekOf,
  whoBar,
  yearColumns,
  type ActivityThing
} from '../collection/activity';
import type { CommitEntry, CommitLogObservation, PublicationsObservation } from '../collection/schema';
import { connectionDiagram, connectionSource, phoneWidth } from '../collection/diagram';
import { parseSites, siteRef, sitesPath, withRef } from '../collection/sites';
import { sitesStrip } from '../collection/sites-strip';

const registry = await loadRegistry();
const observations = await loadObservations();
const now = new Date('2026-10-17T12:00:00Z');
const model = buildSiteModel(registry, observations, now);

test('dates keep the precision the source gave them', () => {
  assert.equal(formatDate('2005'), '2005');
  assert.equal(formatDate('2005-02'), 'Feb 2005');
  assert.equal(formatDate('2017-05-13'), 'May 13, 2017');
  assert.equal(toInstant('2012'), '2012-01-01T00:00:00Z');
  assert.equal(toInstant('2026-10'), '2026-10-01T00:00:00Z');
  assert.equal(toInstant('2026-10-13'), '2026-10-13T00:00:00Z');
});

test('the model keeps status as a decision and activity as evidence', () => {
  assert.equal(model.things.length, registry.things.length);
  for (const thing of model.things) {
    const source = registry.things.find((t) => t.id === thing.id)!;
    assert.equal(thing.status, source.status, 'status comes from the registry only');
    assert.equal(thing.page, `/things/${thing.id}/`);
    assert.equal(thing.markdown, `/things/${thing.id}.md`);
    assert.equal(thing.months.length, 12);
    for (const topic of thing.topicList) assert.equal(topic.page, `/topics/${topic.id}/`);
    if (thing.latest) assert.ok(thing.sources.some((s) => s.evidence.includes(thing.latest!)));
  }
  const weekly = model.things.find((t) => t.id === 'weekly-thing')!;
  assert.ok(weekly.latest, 'an observed thing has latest evidence');
  assert.ok(weekly.months.some((m) => m.count > 0));
  const unobserved = model.things.find((t) => t.id === 'reading-things')!;
  assert.equal(unobserved.latest, null);
  const total = model.statuses.reduce((sum, s) => sum + s.count, 0);
  assert.equal(total, model.things.length);
  assert.deepEqual(
    model.collections.flatMap((c) => c.things.map((t) => t.id)).toSorted(),
    model.things.map((t) => t.id).toSorted()
  );
});

test('inbound connections and events are attached to the thing they concern', () => {
  const elixir = model.things.find((t) => t.id === 'elixir')!;
  assert.ok(elixir.inbound.some((edge) => edge.from === 'elixir-bot'));
  assert.ok(elixir.events.every((event) => event.things.includes('elixir')));
  const flat = model.years.flatMap((y) => y.events);
  assert.equal(flat.length, registry.history.length);
  for (const bucket of model.years) for (const event of bucket.events) assert.ok(event.date.startsWith(bucket.year));
});

test('the Markdown twin is valid front matter that carries the registry record', () => {
  const thing = model.things.find((t) => t.id === 'road-sign-math')!;
  const twin = thingMarkdown(thing);
  const { frontmatter, body } = splitFrontmatter(twin, 'twin') as {
    frontmatter: Record<string, unknown>;
    body: string;
  };
  assert.equal(frontmatter.id, 'road-sign-math');
  assert.equal(frontmatter.status, thing.status);
  assert.equal(frontmatter.started, thing.started);
  assert.equal(frontmatter.page, `${siteUrl}/things/road-sign-math/`);
  assert.ok(Array.isArray(frontmatter.sources));
  assert.ok(!JSON.stringify(frontmatter).includes('observation'), 'observations stay out of the twin');
  assert.match(body, /^# Road Sign Math/m);
  assert.ok(body.includes(thing.body.trim()));
});

test('llms.txt lists every thing and topic by its Markdown twin or page', () => {
  const text = llmsText(model);
  for (const thing of model.things) assert.ok(text.includes(`](${siteUrl}${thing.markdown}): `), thing.id);
  for (const topic of model.topics) assert.ok(text.includes(`](${siteUrl}${topic.page}): `), topic.id);
  const full = llmsFullText(model);
  for (const thing of model.things) assert.ok(full.includes(`id: ${thing.id}\n`), thing.id);
});

test('things.json carries the registry plus the latest observation per source', () => {
  const json = thingsJson(model);
  assert.equal(json.site, siteUrl);
  assert.equal(json.things.length, registry.things.length);
  const weekly = json.things.find((t) => t.id === 'weekly-thing')!;
  const github = weekly.sources.find((s) => s.kind === 'github')!;
  assert.equal(github.observation?.kind, 'github');
  const web = weekly.sources.find((s) => s.kind === 'website')!;
  assert.equal(web.observation?.kind, 'web');
  assert.equal(json.history.length, registry.history.length);
  assert.ok(json.topics.every((topic) => Array.isArray(topic.things)));
  assert.doesNotMatch(JSON.stringify(json), /\/Users\/|localhost|127\.0\.0\.1|ts\.net/);
});

test('the featured shelf keeps its order, and tags links only to sites Tinylytics counts', () => {
  assert.deepEqual(
    model.featured.map(({ thing }) => thing.id),
    registry.featured
  );
  assert.deepEqual(thingsJson(model).featured, registry.featured);
  const text = llmsText(model);
  assert.ok(text.indexOf('## Featured') < text.indexOf('## Things'));
  const counted = (url: string) => ({
    kind: 'tinylytics' as const,
    url,
    observedAt: '2026-10-19T12:00:00Z',
    since: '2025-10-01',
    until: '2026-09-30',
    hits: 1,
    months: [{ month: '2026-09', count: 1 }]
  });
  const featured = ['release-notes', 'mb', 'things-ive-built'];
  const built = buildSiteModel(
    { ...registry, featured },
    [counted('https://notes.yourversionnumber.com'), counted('https://thingelstad.xyz')],
    now
  );
  const [notes, mb, here] = built.featured;
  assert.equal(notes.href, 'https://notes.yourversionnumber.com/?ref=xyz-featured');
  assert.equal(notes.cover, notes.href, 'no capture here, so the cover leads to the same place');
  assert.equal(mb.href, 'https://github.com/jthingelstad/mb', 'Tinylytics does not count GitHub');
  assert.equal(here.href, 'https://thingelstad.xyz/', 'this site never tags itself');
  assert.equal(buildSiteModel({ ...registry, featured: [] }, observations, now).featured.length, 0);
});

test('the feeds are the ledger, newest first', () => {
  const feed = jsonFeed(model);
  assert.equal(feed.items.length, registry.history.length);
  assert.equal(feed.items[0].id, registry.history[0].id);
  for (let i = 1; i < feed.items.length; i++)
    assert.ok(feed.items[i - 1].date_published >= feed.items[i].date_published);
  const rss = rssFeed(model);
  assert.equal(rss.match(/<item>/g)?.length, Math.min(rssItems, registry.history.length), 'RSS carries the newest');
  assert.ok(rss.includes(`<guid isPermaLink="false">${registry.history[0].id}</guid>`), 'newest first');
  assert.ok(rss.includes(`<atom:link href="${siteUrl}/feed.xml"`));
  assert.ok(!rss.includes('<description><p>'), 'HTML inside RSS descriptions is escaped');
});

test('a page that is no thing’s own shares this site’s front page', () => {
  const own = {
    kind: 'screenshot' as const,
    url: `${siteUrl}/`,
    observedAt: '2026-10-20T12:00:00Z',
    image: 'thingelstad-xyz.jpg',
    sha256: 'cd'.repeat(32),
    width: 1280,
    height: 800
  };
  assert.equal(buildSiteModel(registry, [], now).screenshot, null);
  const shot = buildSiteModel(registry, [own], now).screenshot;
  assert.equal(shot?.src, `/assets/screenshots/thingelstad-xyz-${'cd'.repeat(5)}.jpg`);
  assert.equal(shot?.alt, 'The front page of thingelstad.xyz on Oct 20, 2026');
});

test('a website thing shows its own front page and page views, and a thing that only links to it does not', () => {
  const site = 'https://rwbookclub.com/';
  const screenshot = {
    kind: 'screenshot' as const,
    url: site,
    observedAt: '2026-10-20T12:00:00Z',
    image: 'rwbookclub-com.jpg',
    sha256: 'ab'.repeat(32),
    width: 1280,
    height: 800
  };
  const views = {
    kind: 'tinylytics' as const,
    url: site,
    observedAt: '2026-10-19T12:00:00Z',
    since: '2025-10-01',
    until: '2026-09-30',
    hits: 30,
    months: [
      { month: '2026-04', count: 10 },
      { month: '2026-09', count: 20 }
    ]
  };
  const club = registry.things.find((t) => t.sources.some((s) => s.kind === 'website' && s.url === site))!;
  const linker = {
    ...registry.things.find((t) => t.id !== club.id)!,
    id: 'linker',
    sources: [{ kind: 'website' as const, url: site, role: 'reference' as const }]
  };
  const built = buildSiteModel({ ...registry, things: [...registry.things, linker] }, [screenshot, views], now);
  const thing = built.things.find((t) => t.id === club.id)!;
  assert.equal(thing.screenshot?.src, `/assets/screenshots/rwbookclub-com-${'ab'.repeat(5)}.jpg`);
  assert.equal(thing.screenshot?.alt, 'The front page of rwbookclub.com on Oct 20, 2026');
  assert.equal(thing.views?.total, 30);
  assert.equal(thing.views?.months.length, 12, 'every month in the window, with zeros where Tinylytics had none');
  assert.deepEqual(thing.views?.months[0], { month: '2025-10', count: 0 });
  assert.deepEqual(thing.views?.months.at(-1), { month: '2026-09', count: 20 });
  const other = built.things.find((t) => t.id === 'linker')!;
  assert.equal(other.screenshot, null);
  assert.equal(other.views, null);
  const markdown = thingMarkdown(thing);
  assert.doesNotMatch(markdown, /sha256|"hits"/, 'the Markdown twin keeps to the record');
  const json = thingsJson(built).things.find((t) => t.id === club.id)!;
  assert.equal(json.screenshot?.url, `${siteUrl}${screenshotAsset(screenshot)}`);
});

test('artifacts are published beside their thing, shown by an image where there is one, and carried in the twin', () => {
  const velo = model.things.find((t) => t.id === 'velotweets')!;
  const byFile = new Map(velo.artifacts.map((artifact) => [artifact.file, artifact]));
  const logo = byFile.get('masthead-logo.png')!;
  assert.equal(logo.src, '/things/velotweets/artifacts/masthead-logo.png');
  assert.deepEqual(logo.image, { src: logo.src, width: 200, height: 100 });
  assert.equal(logo.kind, 'PNG image');
  const icons = byFile.get('jerseys.zip')!;
  assert.equal(icons.src, '/things/velotweets/artifacts/jerseys.zip');
  assert.equal(
    icons.image?.src,
    '/things/velotweets/artifacts/jerseys.png',
    'a file a browser cannot show uses its preview'
  );
  assert.equal(icons.kind, 'ZIP archive');
  assert.equal(byFile.get('color-palette.ase')!.image, null, 'a file with no preview is a download only');
  for (const artifact of velo.artifacts)
    assert.equal(artifact.bytes, readFileSync(`content/artifacts/velotweets/${artifact.file}`).length);
  assert.deepEqual(model.things.find((t) => t.id === 'elixir')!.artifacts, []);

  const { frontmatter } = splitFrontmatter(thingMarkdown(velo), 'twin') as { frontmatter: Record<string, unknown> };
  const twinArtifacts = frontmatter.artifacts as Record<string, unknown>[];
  assert.equal(twinArtifacts.length, velo.artifacts.length);
  assert.deepEqual(twinArtifacts.at(-1), {
    file: 'jerseys.zip',
    title: icons.title,
    caption: icons.caption,
    preview: 'jerseys.png',
    url: `${siteUrl}/things/velotweets/artifacts/jerseys.zip`
  });
  assert.ok(!thingMarkdown(model.things.find((t) => t.id === 'elixir')!).includes('artifacts:'));
  const json = thingsJson(model).things.find((t) => t.id === 'velotweets')!;
  assert.equal(json.artifacts?.[0].url, `${siteUrl}/things/velotweets/artifacts/masthead-logo.png`);
  assert.equal(json.artifacts?.[0].kind, 'PNG image');
  assert.equal(json.artifacts?.[0].bytes, logo.bytes);
  assert.throws(
    () => buildSiteModel({ ...registry, artifactFiles: undefined }, observations, now),
    /\/[a-z0-9.-]+ was not measured; load the registry with loadRegistry/
  );
});

test('the timeline and sparklines render without gaps in the data', () => {
  const { timeline } = model;
  assert.equal(timeline.years.length, timeline.lastYear - timeline.firstYear + 1);
  assert.equal(timeline.years[0].year, timeline.lastYear, 'newest year first');
  assert.equal(timeline.years.flatMap((y) => y.started).length, timeline.rows.length, 'each thing starts once');
  for (const y of timeline.years) {
    assert.equal(
      y.total,
      y.alive.reduce((sum, s) => sum + s.count, 0)
    );
    assert.doesNotMatch(aliveBar(y, timeline), /NaN|undefined/);
  }
  for (const row of timeline.rows) assert.doesNotMatch(lifespan(row, timeline), /NaN|undefined/, row.thing.id);
  assert.ok(model.timeline.rows.length + model.timeline.undated.length === model.things.length);
  for (const row of model.timeline.rows) assert.ok(row.start <= row.end, row.thing.id);
  const line = sparkline(model.things[0].months, 'test');
  assert.equal(line.match(/<rect/g)?.length, 12);
});

test('stars and forks show only at the reach threshold', () => {
  assert.equal(reach({ stars: reachThreshold - 1, forks: 40 }), null);
  assert.equal(reach({}), null, 'observations from before the counts existed show nothing');
  assert.equal(reach({ stars: 1370, forks: 1 }), '1,370 stars and 1 fork on GitHub');
});

test('stickers are initials on a tile whose hue and tilt follow from the id', () => {
  assert.deepEqual(sticker('weekly-thing', 'Weekly Thing'), sticker('weekly-thing', 'Weekly Thing'));
  assert.equal(sticker('weekly-thing', 'Weekly Thing').letters, 'WT');
  assert.equal(sticker('elixir', 'Elixir').letters, 'EL');
  assert.equal(sticker('612-poap-challenge', '612 POAP Challenge').letters, '6P');
  assert.notEqual(sticker('elixir', 'Elixir').hue, sticker('elixir-bot', 'Elixir Bot').hue);
  const { hue, tilt } = sticker('mb', 'mb');
  assert.ok(hue >= 0 && hue < 360 && tilt >= -3 && tilt <= 3);
});

test('connection diagrams draw the same edges as the list, escaped and linked', () => {
  const lonely = model.things.find((t) => !t.connections.length && !t.inbound.length)!;
  assert.equal(connectionSource(lonely, model), null);
  assert.equal(connectionDiagram(lonely, model), null);
  const bot = model.things.find((t) => t.id === 'elixir-bot')!;
  const source = connectionSource(bot, model)!;
  assert.match(source, /^ {2}t0\["Elixir Bot"\]:::self$/m);
  assert.equal(source.match(/ -->\|| -\.->\|/g)?.length, bot.connections.length + bot.inbound.length);
  assert.equal(
    source.match(/ -\.->\|/g)?.length ?? 0,
    [...bot.connections, ...bot.inbound].filter((e) => e.kind === 'lineage').length
  );
  assert.match(source, /click t\d+ href "\/things\/elixir\/"/);
  const odd = { ...bot, title: 'Say "#1"', connections: [], inbound: bot.inbound.slice(0, 1) };
  assert.match(connectionSource(odd, model)!, /t0\["Say #quot;#35;1#quot;"\]:::self/);
  const diagram = connectionDiagram(bot, model)!;
  assert.match(diagram.wide, /^<svg[^>]*role="graphics-document document"/);
  assert.ok(diagram.wide.includes('href="/things/elixir/"'));
  assert.ok(diagram.wide.includes('class="pele-node pele-shape-rect self"'));
  assert.doesNotMatch(diagram.wide, /<script/);
  assert.equal(diagram.narrow, null, `a hub wider than ${phoneWidth}px is left to the list on phones`);
  assert.ok(
    connectionDiagram(
      model.things.find((t) => t.id === 'mb')!,
      model
    )!.narrow
  );
});

const shared = readFileSync(sitesPath, 'utf8');

test('the sites strip lists the shared sites in file order, with this site current', () => {
  const { sites } = parseSites(shared);
  const strip = sitesStrip(sites);
  assert.deepEqual(
    strip.map((item) => item.id),
    sites.filter((site) => site.in_sites_strip).map((site) => site.id)
  );
  assert.ok(!strip.some((item) => item.id === 'escape'), 'Escaping Things stays out');
  assert.deepEqual(
    strip.filter((item) => item.current),
    [
      {
        id: 'xyz',
        href: 'https://thingelstad.xyz/?ref=sites-strip-xyz',
        description: sites.find((site) => site.id === 'xyz')!.description,
        label: 'Projects',
        current: true
      }
    ]
  );
  for (const item of strip) {
    const site = sites.find((s) => s.id === item.id)!;
    assert.equal(item.label, site.strip_label, `${item.id} reads the same as on every other site`);
    assert.equal(item.href, `${site.url}?ref=sites-strip-xyz`);
  }
  const without = sites.map((site) => (site.id === 'xyz' ? { ...site, in_sites_strip: false } : site));
  assert.throws(() => sitesStrip(without), /does not put xyz in the strip/);
  assert.throws(() => parseSites('{"sites": []}'), /has no sites list/);
  assert.throws(
    () => parseSites(JSON.stringify({ ...JSON.parse(shared), sites: [{ ...sites[0], url: 'http://example.com/' }] })),
    /not an HTTPS URL/
  );
});

test('the shared list names Jamie the same way on every site', () => {
  const { owner } = parseSites(shared);
  const data = JSON.parse(shared) as { owner: Record<string, unknown> };
  assert.deepEqual(owner, data.owner);
  assert.equal(owner.name, 'Jamie Thingelstad');
  assert.equal(owner.url, 'https://www.thingelstad.com/', 'the identity link is the clean URL');
  assert.match(owner.avatar, /^https:\/\/avatars\.micro\.blog\//);
  assert.ok(owner.note.length > 0);
  assert.ok(owner.rel_me.length > 0 && owner.rel_me.every((url) => url.startsWith('https://')));
  const without = (change: Record<string, unknown>) =>
    JSON.stringify({ ...JSON.parse(shared), owner: { ...data.owner, ...change } });
  assert.throws(() => parseSites(JSON.stringify({ sites: JSON.parse(shared).sites })), /has no owner/);
  assert.throws(() => parseSites(without({ note: '' })), /the owner has no note/);
  assert.throws(() => parseSites(without({ avatar: 'http://example.com/me.jpg' })), /must be HTTPS/);
  assert.throws(() => parseSites(without({ rel_me: ['http://example.com/'] })), /rel_me/);
  assert.throws(() => parseSites(without({ rel_me: [] })), /rel_me/);
});

test('the search facets count every thing, and each row carries the values it is counted under', () => {
  const facet = (name: string) => model.facets.find((f) => f.name === name)!;
  assert.deepEqual(
    model.facets.map((f) => f.name),
    ['status', 'year', 'topic', 'collection', 'language']
  );
  // Status in the legend's order, with the legend's counts; every thing has one status and one collection.
  assert.deepEqual(
    facet('status').values.map((v) => [v.value, v.count]),
    model.statuses.map((s) => [s.status, s.count])
  );
  for (const name of ['status', 'collection'])
    assert.equal(
      facet(name).values.reduce((sum, v) => sum + v.count, 0),
      model.things.length
    );
  assert.deepEqual(
    facet('collection').values.map((v) => v.label),
    model.collections.map((c) => c.name)
  );
  assert.ok(
    facet('collection').values.some((v) => v.value === 'art-and-archives'),
    'a slug spells out &'
  );
  // Every year from the first start to this one, empty years included, so the histogram has no gaps.
  const years = facet('year').values.map((v) => Number(v.value));
  assert.equal(years.at(-1), now.getUTCFullYear());
  assert.ok(years.every((year, i) => !i || year === years[i - 1] + 1));
  assert.ok(facet('year').values.some((v) => !v.count));
  assert.equal(
    facet('year').values.reduce((sum, v) => sum + v.count, 0),
    model.things.filter((t) => t.started).length
  );
  for (const f of model.facets) assert.equal(f.most, Math.max(...f.values.map((v) => v.count)));
  // Topics and languages most first.
  for (const name of ['topic', 'language']) {
    const counts = facet(name).values.map((v) => v.count);
    assert.deepEqual(
      counts,
      counts.toSorted((a, b) => b - a)
    );
  }
  for (const thing of model.things) {
    const values = (name: string) => thing.filters.filter((f) => f.name === name).map((f) => f.value);
    assert.deepEqual(values('status'), [thing.status]);
    assert.deepEqual(
      values('topic'),
      thing.topicList.map((t) => t.id)
    );
    assert.deepEqual(values('year'), thing.started ? [thing.started.slice(0, 4)] : []);
    // The language is the top one GitHub reports for each repository, never a claim of the registry's.
    const top = new Set(
      thing.sources.flatMap((source) =>
        source.observation?.kind === 'github' ? source.observation.languages.slice(0, 1).map((l) => l.name) : []
      )
    );
    assert.deepEqual(
      thing.filters.filter((f) => f.name === 'language').map((f) => f.label),
      [...top]
    );
    for (const f of thing.filters) {
      assert.match(f.value, /^[a-z0-9-]+$/, 'a value is a slug that fits the address and data-filters');
      assert.ok(facet(f.name).values.some((v) => v.value === f.value && v.label === f.label));
    }
  }
});

test('a ref joins any query and goes before any fragment', () => {
  assert.equal(
    withRef('https://weekly.thingelstad.com/', 'xyz-thing'),
    'https://weekly.thingelstad.com/?ref=xyz-thing'
  );
  assert.equal(
    withRef('https://thingy.thingelstad.com/?prompt=a%20b', 'xyz-thing'),
    'https://thingy.thingelstad.com/?prompt=a%20b&ref=xyz-thing'
  );
  assert.equal(
    withRef('https://weekly.thingelstad.com/archive/306/#journal', 'xyz-source'),
    'https://weekly.thingelstad.com/archive/306/?ref=xyz-source#journal'
  );
  assert.equal(
    withRef('https://thingy.thingelstad.com/?from=a#top', 'xyz-thing'),
    'https://thingy.thingelstad.com/?from=a&ref=xyz-thing#top'
  );
  assert.equal(withRef('https://www.thingelstad.com/?', 'xyz-thing'), 'https://www.thingelstad.com/?ref=xyz-thing');
});

test('only links to another strip site carry a ref', () => {
  const { sites } = parseSites(shared);
  const ref = siteRef(sites);
  for (const site of sites.filter((s) => s.in_sites_strip && s.id !== 'xyz'))
    assert.equal(ref(site.url, 'thing'), `${site.url}?ref=xyz-thing`, site.id);
  assert.equal(
    ref('https://www.thingelstad.com/2021/04/28/four-great-years.html', 'source'),
    'https://www.thingelstad.com/2021/04/28/four-great-years.html?ref=xyz-source'
  );
  for (const url of [
    'https://thingelstad.xyz/', // this site
    'https://escape.thingelstad.com/', // not in the strip
    'https://ottoai.thingelstad.com/',
    'https://github.com/jthingelstad/thingelstad.xyz',
    'not a url'
  ])
    assert.equal(ref(url, 'thing'), url);
});

const commitAt = (n: number, date: string, by: CommitEntry['by'], extra: Partial<CommitEntry> = {}): CommitEntry => ({
  sha: String(n).padStart(12, '0'),
  date,
  subject: `Change ${n}`,
  by,
  ...extra
});
const sharedLog: CommitLogObservation = {
  kind: 'commits',
  repository: 'owner/sharedLog',
  url: 'https://github.com/owner/sharedLog',
  observedAt: '2026-10-22T15:00:00.000Z', // Thursday Oct 22, Central
  branch: 'main',
  commits: [
    commitAt(9, '2026-10-23T01:00:00.000Z', 'me'), // after the collection: waits for the next one
    commitAt(1, '2026-10-22T04:30:00.000Z', 'agent', { agents: ['claude'], paths: ['a', 'b'] }), // Oct 21 Central
    commitAt(2, '2026-10-21T15:00:00.000Z', 'agent', { paths: ['a'], pr: 7, subject: 'Add a page (#7)' }),
    commitAt(3, '2026-10-19T15:00:00.000Z', 'others', { paths: ['b'] }),
    commitAt(4, '2026-10-12T15:00:00.000Z', 'me', { paths: ['a'] }),
    commitAt(5, '2024-03-01T15:00:00.000Z', 'me', { paths: ['a'] })
  ],
  tags: [{ name: 'v1', date: '2026-10-21T16:00:00.000Z' }]
};
const successor: CommitLogObservation = {
  ...sharedLog,
  repository: 'someone/fork',
  url: 'https://github.com/someone/fork',
  commits: [commitAt(8, '2026-10-21T15:00:00.000Z', 'others')],
  tags: []
};
const posts: PublicationsObservation = {
  kind: 'publications',
  url: 'https://a.example.com/',
  feed: 'https://a.example.com/feed.xml',
  observedAt: '2026-10-22T14:00:00.000Z',
  items: [
    { url: 'https://a.example.com/post', title: 'A post', date: '2026-10-21T17:00:00.000Z' },
    { url: null, title: null, excerpt: 'Opening words', date: '2026-10-20T17:00:00.000Z' }
  ]
};
const activityThings: ActivityThing[] = [
  {
    id: 'a',
    title: 'Thing A',
    page: '/things/a/',
    status: 'active',
    sources: [
      { kind: 'github', repository: 'owner/sharedLog', role: 'implementation', path: 'a' },
      { kind: 'github', repository: 'someone/fork', role: 'successor' },
      { kind: 'website', url: 'https://a.example.com/', role: 'website', feed: 'https://a.example.com/feed.xml' },
      { kind: 'website', url: 'https://a.example.com/', role: 'podcast', feed: 'https://a.example.com/feed.xml' }
    ]
  },
  {
    id: 'b',
    title: 'Thing B',
    page: '/things/b/',
    status: 'retired',
    sources: [
      { kind: 'github', repository: 'owner/sharedLog', role: 'implementation', path: 'b' },
      { kind: 'website', url: 'https://a.example.com/', role: 'reference', feed: 'https://a.example.com/feed.xml' }
    ]
  },
  {
    id: 'c',
    title: 'Thing C',
    page: '/things/c/',
    status: 'active',
    sources: [{ kind: 'github', repository: 'owner/sharedLog', role: 'implementation' }]
  }
];

test('activity groups commits and posts by Central day and Monday week, counting each commit once', () => {
  assert.equal(localDay('2026-10-22T04:30:00.000Z'), '2026-10-21');
  assert.equal(weekOf('2026-10-25'), '2026-10-19');
  assert.equal(weekOf('2026-10-19'), '2026-10-19');
  const { activity, things } = buildActivity(activityThings, [sharedLog, successor], [posts]);
  assert.equal(activity.collected, '2026-10-22T15:00:00.000Z');
  assert.equal(
    activity.total,
    5,
    'the sharedLog commit is counted once, the successor and the future commit not at all'
  );
  assert.equal(activity.publications, 2, 'a newsletter and its podcast feed count once; a reference feed not at all');
  assert.deepEqual(
    activity.years.map((y) => [y.year, y.total]),
    [
      [2026, 4],
      [2025, 0],
      [2024, 1]
    ]
  );
  const [week, last] = activity.weeks;
  assert.equal(week.id, 'w-2026-10-19');
  assert.equal(week.current, true);
  assert.equal(last.id, 'w-2026-10-12');
  assert.equal(activity.weeks.length, 12);
  assert.equal(week.commits, 3);
  assert.deepEqual(week.who, { me: 0, agent: 2, others: 1, claude: 1, codex: 0 });
  const a = week.things.find((t) => t.id === 'a')!;
  assert.equal(a.commits, 2);
  assert.equal(a.publicationCount, 2);
  assert.deepEqual(
    a.headlines.map((h) => h.text),
    ['Change 1', 'Add a page (#7)'],
    'a directory scope has no tags'
  );
  assert.equal(a.more, 0);
  assert.equal(a.moreUrl, null, 'every commit is a headline, so no link to the rest');
  const c = week.things.find((t) => t.id === 'c')!;
  assert.deepEqual(
    c.headlines.map((h) => h.text),
    ['Change 1', 'Tagged v1', 'Add a page (#7)'],
    'tags, then pull requests, then the rest, shown newest first'
  );
  assert.equal(c.more, 1);
  assert.equal(c.moreUrl, 'https://github.com/owner/sharedLog/commits/main?since=2026-10-19&until=2026-10-25');
  assert.deepEqual(
    a.published.map((p) => [p.text, p.url]),
    [
      ['A post', 'https://a.example.com/post'],
      ['Opening words', '/things/a/']
    ]
  );
  assert.deepEqual(
    activity.days.map((d) => d.day),
    ['2026-10-21', '2026-10-20', '2026-10-19', '2026-10-12', '2024-03-01'],
    'complete days only: the collection ran on Oct 22'
  );
  assert.equal(activity.days[0].week, 'w-2026-10-19');
  const recordA = things.get('a')!;
  assert.equal(recordA.total, 4);
  assert.equal(recordA.firstCommit, '2024-03-01');
  assert.deepEqual(
    recordA.years.map((y) => y.total),
    [1, 0, 1 + 2],
    'every year from the first commit to now, for an active thing'
  );
  assert.deepEqual(recordA.peak, { year: 2026, total: 3 });
  assert.equal(recordA.recent[0].week, 'w-2026-10-19');
  assert.equal(recordA.recent.at(-1)!.week, null, 'a week no longer on /activity/ has no anchor');
  const recordB = things.get('b')!;
  assert.deepEqual(
    recordB.years.map((y) => y.year),
    [2026],
    'a retired thing stops at its last commit'
  );
  assert.equal(recordB.publications, 0);
});

test('activity reads as sentences, charts, and a feed of complete days', () => {
  const who = { me: 2, agent: 46, others: 0, claude: 40, codex: 1 };
  assert.equal(
    activitySummary({ commits: 48, who, publications: 2 }),
    '48 commits (40 with Claude, 1 with Codex, 5 with another agent, 2 by me) and 2 publications'
  );
  const claude = { me: 0, agent: 9, others: 0, claude: 9, codex: 0 };
  assert.equal(
    activitySummary({ total: 9, who: claude, publications: 1 }),
    '9 commits, all with Claude, and 1 publication'
  );
  assert.equal(activitySummary({ commits: 1, who: { ...claude, agent: 0, claude: 0, me: 1 } }), '1 commit by me');
  assert.equal(
    activitySummary({ commits: 0, who: { ...claude, agent: 0, claude: 0 }, publicationCount: 3 }),
    '3 publications'
  );
  const bar = whoBar(who, 96, '2026: <48> commits');
  assert.match(bar, /aria-label="2026: &lt;48&gt; commits"/);
  assert.equal(bar.match(/class="who-(me|agent|others)"/g)?.length, 2, 'one mark for each author with commits');
  assert.match(bar, /<title>46 with an agent<\/title>/);
  const { things } = buildActivity(activityThings, [sharedLog], [posts]);
  const columns = yearColumns(things.get('a')!, 'Thing A');
  assert.equal(columns.match(/class="who-none"/g)?.length, 1, 'an empty year is a hairline');
  assert.match(columns, /aria-label="Thing A: commits per year from 2024 to 2026, 4 commits in all"/);
  assert.equal(yearColumns(things.get('b')!, 'Thing B'), '', 'one year is a number, not a chart');

  const rss = activityRss(model);
  assert.equal(rss.match(/<item>/g)?.length, model.activity.days.length);
  assert.ok(model.activity.days.length <= 30);
  assert.ok(rss.includes(`<atom:link href="${siteUrl}/activity.xml"`));
  assert.ok(!rss.includes('<description><p>'), 'HTML inside RSS descriptions is escaped');
  for (const day of model.activity.days) {
    assert.ok(rss.includes(`<guid isPermaLink="false">activity-${day.day}</guid>`));
    assert.ok(day.day < localDay(model.activity.collected!), 'a day is in the feed once it is over');
  }
});
