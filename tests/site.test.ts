import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRegistry } from '../collection/load';
import { loadObservations } from '../collection/observations';
import {
  buildSiteModel,
  formatDate,
  jsonFeed,
  llmsFullText,
  llmsText,
  rssFeed,
  siteUrl,
  sparkline,
  thingMarkdown,
  thingsJson,
  timelineSvg,
  toInstant,
  sticker,
  reach,
  reachThreshold
} from '../collection/site';
import { splitFrontmatter } from '../collection/load';

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

test('the feeds are the ledger, newest first', () => {
  const feed = jsonFeed(model);
  assert.equal(feed.items.length, registry.history.length);
  assert.equal(feed.items[0].id, registry.history[0].id);
  for (let i = 1; i < feed.items.length; i++)
    assert.ok(feed.items[i - 1].date_published >= feed.items[i].date_published);
  const rss = rssFeed(model);
  assert.equal(rss.match(/<item>/g)?.length, registry.history.length);
  assert.ok(rss.includes(`<atom:link href="${siteUrl}/feed.xml"`));
  assert.ok(!rss.includes('<description><p>'), 'HTML inside RSS descriptions is escaped');
});

test('the timeline and sparklines render without gaps in the data', () => {
  const svg = timelineSvg(model.timeline);
  assert.equal(svg.match(/class="tl-row"/g)?.length, model.timeline.rows.length);
  assert.doesNotMatch(svg, /NaN|undefined/);
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
