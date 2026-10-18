import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observeRepository, type GitHubReader } from '../collection/adapters/github';
import { monthCounts, observeWebsite, parseFeed, parseSitemap } from '../collection/adapters/web';
import { collect, sameEvidence, targets } from '../collection/collect';
import { observationPath } from '../collection/observations';
import type { Observation, Registry, Thing } from '../collection/schema';

const now = new Date('2026-10-14T12:00:00Z');
const fakeCommit = (n = 1) => ({
  sha: n.toString(16).padStart(40, '0'),
  html_url: `https://github.com/owner/example/commit/${n.toString(16).padStart(40, '0')}`,
  commit: { committer: { date: '2026-10-13T12:00:00Z' } }
});
const fakeReader: GitHubReader = async (endpoint) => {
  if (endpoint.endsWith('/languages')) return { TypeScript: 100, CSS: 20 };
  if (endpoint.includes('/releases'))
    return [
      { tag_name: 'draft', draft: true, prerelease: false, published_at: now.toISOString() },
      {
        tag_name: 'v1',
        draft: false,
        prerelease: false,
        published_at: now.toISOString(),
        html_url: 'https://github.com/owner/example/releases/tag/v1'
      }
    ];
  if (endpoint.includes('/commits'))
    return [fakeCommit(), ...(endpoint.includes('per_page=100') ? [fakeCommit()] : [])];
  return {
    full_name: 'owner/example',
    private: false,
    visibility: 'public',
    default_branch: 'main',
    created_at: '2020-01-01T00:00:00Z',
    html_url: 'https://github.com/owner/example',
    archived: false,
    description: 'An example.',
    stargazers_count: 12,
    forks_count: 3,
    secret_extra: 'never published'
  };
};

test('GitHub observations project an allowlist of public fields', async () => {
  const observation = await observeRepository('owner/example', [null, 'packages/a'], fakeReader, now);
  assert.equal(observation.kind, 'github');
  assert.equal(observation.release?.name, 'v1');
  assert.equal(observation.stars, 12);
  assert.equal(observation.forks, 3);
  assert.deepEqual(observation.languages[0], { name: 'TypeScript', bytes: 100 });
  assert.equal(observation.activity.length, 2);
  assert.equal(observation.activity[0].count, 1, 'duplicate commit IDs are counted once');
  assert.equal(observation.activity[0].complete, true);
  assert.doesNotMatch(JSON.stringify(observation), /secret_extra|never published/);
  assert.equal(observationPath(observation), 'data/observations/github/example.json');
  await assert.rejects(
    observeRepository(
      'owner/example',
      [],
      async (e) => ({ ...((await fakeReader(e)) as object), private: true, visibility: 'private' }),
      now
    ),
    /public repositories/
  );
});

const rss = `<?xml version="1.0"?><rss version="2.0"><channel><title>Weekly &amp; Thing</title>
<item><title>A</title><pubDate>Sat, 10 Oct 2026 12:00:00 GMT</pubDate></item>
<item><title>B</title><pubDate>Sat, 03 Oct 2026 12:00:00 GMT</pubDate></item>
<item><title>C</title><pubDate>Sat, 03 Oct 2015 12:00:00 GMT</pubDate></item></channel></rss>`;
const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom site</title>
<entry><title>One</title><published>2026-09-01T00:00:00Z</published></entry>
<entry><title>Two</title><updated>2026-09-15T00:00:00Z</updated></entry></feed>`;
const jsonFeed = JSON.stringify({
  version: 'https://jsonfeed.org/version/1.1',
  title: 'JSON site',
  items: [{ id: '1', date_published: '2026-08-02T10:00:00-05:00' }, { id: '2' }]
});
test('feeds in RSS, Atom, and JSON Feed form produce publishing evidence', () => {
  const a = parseFeed(rss);
  assert.equal(a.title, 'Weekly & Thing');
  assert.equal(a.items, 3);
  assert.deepEqual(monthCounts(a.dates, now), [{ month: '2026-10', count: 2 }]);
  const b = parseFeed(atom);
  assert.equal(b.title, 'Atom site');
  assert.deepEqual(monthCounts(b.dates, now), [{ month: '2026-09', count: 2 }]);
  const c = parseFeed(jsonFeed);
  assert.equal(c.title, 'JSON site');
  assert.equal(c.items, 2);
  assert.deepEqual(monthCounts(c.dates, now), [{ month: '2026-08', count: 1 }]);
});

const sitemapIndex = `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://example.com/a.xml</loc></sitemap></sitemapindex>`;
const urlset = `<urlset><url><loc>https://example.com/</loc><lastmod>2026-10-01T00:00:00Z</lastmod></url>
<url><loc>https://example.com/old/</loc><lastmod>2019-01-01</lastmod></url><url><loc>https://example.com/none/</loc></url></urlset>`;
test('sitemaps count pages and lastmod months, following an index', async () => {
  assert.deepEqual(parseSitemap(sitemapIndex).children, ['https://example.com/a.xml']);
  const fetchText = async (url: string) =>
    url.endsWith('sitemap.xml') ? sitemapIndex : url.endsWith('a.xml') ? urlset : rss;
  const observation = await observeWebsite(
    { url: 'https://example.com/', sitemap: 'https://example.com/sitemap.xml', feed: 'https://example.com/feed.xml' },
    fetchText,
    now
  );
  assert.equal(observation.sitemap?.pages, 3);
  assert.equal(observation.sitemap?.newestModified, '2026-10-01T00:00:00.000Z');
  assert.deepEqual(observation.sitemap?.months, [{ month: '2026-10', count: 1 }]);
  assert.equal(observation.feed?.newestPublished, '2026-10-10T12:00:00.000Z');
  assert.equal(observationPath(observation), 'data/observations/web/example-com.json');
});

const thing = (id: string, sources: Thing['sources']): Thing => ({
  id,
  title: id,
  summary: id,
  collection: 'Examples',
  status: 'active',
  url: null,
  topics: [],
  sources,
  connections: [],
  body: ''
});
const registry: Registry = {
  topics: [],
  history: [],
  things: [
    thing('a', [{ kind: 'github', repository: 'owner/example', role: 'implementation', path: 'packages/a' }]),
    thing('b', [
      { kind: 'github', repository: 'Owner/Example', role: 'implementation' },
      { kind: 'website', url: 'https://example.com/', role: 'website', feed: 'https://example.com/feed.xml' }
    ]),
    thing('c', [{ kind: 'website', url: 'https://plain.example.com/', role: 'reference' }])
  ]
};
test('the collector observes each source once and writes only changed evidence', async () => {
  const found = targets(registry);
  assert.deepEqual(found.repositories, [{ repository: 'Owner/Example', paths: [null, 'packages/a'] }]);
  assert.deepEqual(found.websites, [{ url: 'https://example.com/', feed: 'https://example.com/feed.xml' }]);
  const saved: Observation[] = [];
  const first = await collect({
    registry,
    existing: [],
    github: fakeReader,
    web: async () => rss,
    now,
    save: async (o) => (saved.push(o), 'x'),
    log: () => {}
  });
  assert.deepEqual(first.written, ['Owner/Example', 'https://example.com/']);
  const later = new Date('2026-10-21T12:00:00Z');
  const second = await collect({
    registry,
    existing: saved,
    github: fakeReader,
    web: async () => rss,
    now: later,
    save: async () => assert.fail('nothing changed'),
    log: () => {}
  });
  assert.deepEqual(second.unchanged, ['Owner/Example', 'https://example.com/']);
  const third = await collect({
    registry,
    existing: saved,
    github: async () => {
      throw new Error('offline');
    },
    web: async () =>
      rss.replace('<title>A</title>', '<title>A2</title><pubDate>Mon, 12 Oct 2026 12:00:00 GMT</pubDate>'),
    now: later,
    save: async () => 'x',
    log: () => {}
  });
  assert.equal(third.failed[0].target, 'Owner/Example');
  assert.deepEqual(third.written, ['https://example.com/']);
  assert.ok(sameEvidence(saved[0], { ...saved[0], observedAt: later.toISOString() }));
});
