import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observeRepository, type GitHubReader } from '../collection/adapters/github';
import { monthCounts, observePublications, observeWebsite, parseFeed, parseSitemap } from '../collection/adapters/web';
import { attribute, isBot, observeCommits, parseLog, subjectOf, type GitRunner } from '../collection/adapters/git';
import { listSites, observeSite, rootOrigin, type TinylyticsReader } from '../collection/adapters/tinylytics';
import { capturedUrl, observeCaptures } from '../collection/adapters/wayback';
import { screenshotDue, type Capturer } from '../collection/adapters/screenshot';
import { collect, sameEvidence, targets } from '../collection/collect';
import { observationPath } from '../collection/observations';
import type { Observation, Registry, ScreenshotObservation, Thing } from '../collection/schema';

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
  assert.equal(observation.activity[0].since, '2026-07-01T00:00:00.000Z', 'the window starts on a month boundary');
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
    git: null,
    tinylytics: null,
    wayback: null,
    screenshots: null,
    log: () => {}
  });
  assert.deepEqual(first.written, ['Owner/Example', 'https://example.com/', 'publications https://example.com/']);
  const later = new Date('2026-10-21T12:00:00Z');
  const second = await collect({
    registry,
    existing: saved,
    github: fakeReader,
    web: async () => rss,
    now: later,
    save: async () => assert.fail('nothing changed'),
    git: null,
    tinylytics: null,
    wayback: null,
    screenshots: null,
    log: () => {}
  });
  assert.deepEqual(second.unchanged, ['Owner/Example', 'https://example.com/', 'publications https://example.com/']);
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
    git: null,
    tinylytics: null,
    wayback: null,
    screenshots: null,
    log: () => {}
  });
  assert.equal(third.failed[0].target, 'Owner/Example');
  assert.deepEqual(third.written, ['https://example.com/', 'publications https://example.com/']);
  assert.ok(sameEvidence(saved[0], { ...saved[0], observedAt: later.toISOString() }));
});

const tinylyticsReader: TinylyticsReader = async (endpoint) => {
  if (endpoint === 'sites')
    return {
      sites: [
        { id: 1, url: 'https://example.com', label: 'Example', notes: 'private note' },
        { id: 3, url: 'https://www.plain.example.com', label: 'Matches without www.' },
        { id: 2, url: 'https://elsewhere.example.org/', label: 'Not in the registry' }
      ]
    };
  assert.match(
    endpoint,
    /^sites\/[13]\/hits\?grouped=true&group_by=date&interval=month&start_date=2025-10-01&end_date=2026-09-30$/
  );
  return {
    grouped_hits: [
      { date: '2026-08-01', hit_count: 40 },
      { date: '2026-09-01', hit_count: 2 }
    ],
    summary: { total_hits: 42, unique_visitors: 30 }
  };
};

test('Tinylytics observations record monthly page views for registry sites only', async () => {
  assert.equal(rootOrigin('https://example.com/'), 'https://example.com');
  assert.equal(
    rootOrigin('https://example.com/projects/open-loop/'),
    null,
    'a page inside a site never takes its traffic'
  );
  assert.equal(rootOrigin('http://example.com/'), null);
  const sites = await listSites(tinylyticsReader);
  assert.deepEqual(sites[0], { id: 1, url: 'https://example.com' });
  const observation = await observeSite(sites[0], tinylyticsReader, now);
  assert.equal(observation.url, 'https://example.com/');
  assert.equal(observation.hits, 42);
  assert.deepEqual(observation.months, [
    { month: '2026-08', count: 40 },
    { month: '2026-09', count: 2 }
  ]);
  assert.deepEqual([observation.since, observation.until], ['2025-10-01', '2026-09-30'], 'complete months only');
  assert.doesNotMatch(JSON.stringify(observation), /private note|unique_visitors/);
  assert.equal(observationPath(observation), 'data/observations/tinylytics/example-com.json');

  const saved: Observation[] = [];
  const logged: string[] = [];
  const result = await collect({
    registry,
    existing: [],
    only: 'tinylytics',
    tinylytics: tinylyticsReader,
    now,
    save: async (o) => (saved.push(o), 'x'),
    log: () => {}
  });
  assert.deepEqual(
    result.written,
    ['https://example.com/', 'https://www.plain.example.com/'],
    'only sites the registry names are observed, with or without www.'
  );
  const skipped = await collect({
    registry,
    existing: [],
    only: 'tinylytics',
    tinylytics: null,
    wayback: null,
    screenshots: null,
    log: (l) => logged.push(l)
  });
  assert.deepEqual(skipped.written, []);
  assert.match(logged.join(), /No TINYLYTICS_API_KEY/);
});

test('Wayback observations count capture days and unwrap Wayback links', async () => {
  assert.equal(
    capturedUrl('https://web.archive.org/web/20120512222332/http://wiki.planetkubb.com/wiki/Main_Page'),
    'http://wiki.planetkubb.com/wiki/Main_Page'
  );
  assert.equal(capturedUrl('https://example.com/'), 'https://example.com/');
  const requested: string[] = [];
  const cdx = JSON.stringify([['timestamp'], ['20050214022942'], ['20050301120000'], ['20160101000000']]);
  const observation = await observeCaptures('https://example.com/', async (url) => (requested.push(url), cdx), now);
  assert.match(requested[0], /^https:\/\/web\.archive\.org\/cdx\/search\/cdx\?url=https%3A%2F%2Fexample\.com%2F&/);
  assert.match(requested[0], /collapse=timestamp%3A8&filter=statuscode%3A200$/);
  assert.equal(observation.firstCapture, '2005-02-14');
  assert.equal(observation.latestCapture, '2016-01-01');
  assert.deepEqual(observation.years, [
    { year: '2005', days: 2 },
    { year: '2016', days: 1 }
  ]);
  assert.equal(observationPath(observation), 'data/observations/wayback/example-com.json');
  const none = await observeCaptures('https://never.example/', async () => '[]', now);
  assert.equal(none.firstCapture, null);

  const found = targets(registry);
  assert.deepEqual(found.captured, ['https://example.com/'], 'reference sources are not captured');
  const pauses: number[] = [];
  const result = await collect({
    registry,
    existing: [],
    only: 'wayback',
    wayback: async () => cdx,
    pause: async (ms) => void pauses.push(ms),
    now,
    save: async () => 'x',
    log: () => {}
  });
  assert.deepEqual(result.written, ['wayback https://example.com/']);
  assert.deepEqual(pauses, [6000], 'the collector pauses between Internet Archive requests');
  const twoSites: Registry = {
    ...registry,
    things: [...registry.things, thing('d', [{ kind: 'website', url: 'https://second.example.com/', role: 'website' }])]
  };
  let calls = 0;
  const limited = await collect({
    registry: twoSites,
    existing: [],
    only: 'wayback',
    wayback: async (url) => {
      calls++;
      throw new Error(`429 for ${url}`);
    },
    pause: async () => {},
    now,
    save: async () => 'x',
    log: () => {}
  });
  assert.equal(calls, 1, 'a 429 stops the Wayback requests for the run');
  assert.equal(limited.failed.length, 1);
});

test('screenshots capture active website roots once a month, and only when the page changed', async () => {
  const sites: Registry = {
    ...registry,
    things: [
      ...registry.things,
      { ...thing('d', [{ kind: 'website', url: 'https://gone.example.org/', role: 'website' }]), status: 'retired' },
      thing('e', [{ kind: 'website', url: 'https://example.com/projects/e/', role: 'website' }])
    ]
  };
  assert.deepEqual(
    targets(sites).screenshots,
    ['https://example.com/'],
    'front pages only, never a retired thing or a page inside a site'
  );
  let pixels = 'first';
  const captured: string[] = [];
  let closed = 0;
  const capturer: Capturer = {
    capture: async (url) => (captured.push(url), { image: new TextEncoder().encode(pixels), width: 1280, height: 800 }),
    close: async () => void closed++
  };
  const saved: { observation: ScreenshotObservation; image: Uint8Array }[] = [];
  const run = (existing: Observation[], at: Date) =>
    collect({
      registry: sites,
      existing,
      only: 'screenshots',
      screenshots: capturer,
      now: at,
      saveScreenshot: async (observation, image) => (saved.push({ observation, image }), 'x'),
      log: () => {}
    });
  const first = await run([], now);
  assert.deepEqual(first.written, ['screenshot https://example.com/']);
  const shot = saved[0].observation;
  assert.equal(shot.image, 'example-com.jpg');
  assert.equal(observationPath(shot), 'data/observations/screenshot/example-com.json');
  assert.match(shot.sha256, /^[a-f0-9]{64}$/);

  const weekLater = await run([shot], new Date('2026-10-21T12:00:00Z'));
  assert.deepEqual(weekLater.unchanged, ['screenshot https://example.com/'], 'a recent capture is not retaken');
  assert.equal(captured.length, 1);

  const monthLater = new Date('2026-11-11T09:00:00Z'); // four weekly runs on, a few hours early
  assert.ok(screenshotDue(shot, monthLater));
  const same = await run([shot], monthLater);
  assert.deepEqual(same.unchanged, ['screenshot https://example.com/'], 'the same pixels are not written again');
  pixels = 'second';
  const changed = await run([shot], monthLater);
  assert.deepEqual(changed.written, ['screenshot https://example.com/']);
  assert.equal(saved.length, 2);
  assert.equal(closed, 4, 'the browser is closed after every run');

  const broken = await collect({
    registry: sites,
    existing: [],
    only: 'screenshots',
    screenshots: {
      capture: async () => Promise.reject(new Error('503 for https://example.com/')),
      close: async () => {}
    },
    now,
    saveScreenshot: async () => assert.fail('nothing to save'),
    log: () => {}
  });
  assert.equal(broken.failed[0].target, 'screenshot https://example.com/');
});

test('commits are attributed to me, an agent, or others, and bots are left out', () => {
  assert.equal(isBot('dependabot[bot]', '49699333+dependabot[bot]@users.noreply.github.com'), true);
  assert.equal(isBot('Translation Bot', 'translatewiki@example.org'), true);
  assert.equal(isBot('Lib Upgrader', 'tools.libraryupgrader@tools.wmflabs.org'), true);
  assert.equal(isBot('Abbott', 'abbott@example.com'), false, 'bot only as a word');
  assert.equal(attribute('github-actions[bot]', 'actions@github.com', []), null);
  assert.deepEqual(attribute('Jamie Thingelstad', 'jamie@thingelstad.com', []), { by: 'me', agents: [] });
  assert.deepEqual(attribute('jthingelstad', '123+jthingelstad@users.noreply.github.com', []), {
    by: 'me',
    agents: []
  });
  assert.deepEqual(
    attribute('Jamie Thingelstad', 'jamie@thingelstad.com', ['Claude Opus 5.5 <noreply@anthropic.com>']),
    { by: 'agent', agents: ['claude'] },
    'a co-author line names the agent'
  );
  assert.deepEqual(attribute('Codex', 'codex@openai.com', []), { by: 'agent', agents: ['codex'] });
  assert.deepEqual(attribute('Otto Thing', 'otto@thingelstad.com', []), { by: 'agent', agents: [] });
  assert.deepEqual(attribute('A Friend', 'friend@example.com', []), { by: 'others', agents: [] });
  assert.equal(
    attribute('Jamie Thingelstad', 'jamie@thingelstad.com', ['dependabot[bot] <support@github.com>']),
    null,
    'a merged bot pull request'
  );
  assert.deepEqual(subjectOf('Merge pull request #12 from owner/branch', '\nAdd the activity page\n'), {
    subject: 'Add the activity page',
    pr: 12
  });
  assert.deepEqual(subjectOf('Add the activity page (#13)', ''), { subject: 'Add the activity page (#13)', pr: 13 });
  assert.equal(subjectOf('x'.repeat(300), '').subject.length, 160);
});

const sha = (n: number) => String(n).repeat(40);
const logOutput = [
  [sha(1), '2026-10-20T09:00:00-05:00', 'Jamie Thingelstad', 'jamie@thingelstad.com', '', 'Fix it', ''],
  [
    sha(2),
    '2026-10-21T09:00:00-05:00',
    'Jamie Thingelstad',
    'jamie@thingelstad.com',
    'Claude <noreply@anthropic.com>',
    'Merge pull request #4 from owner/feature',
    'Build the feature\n\nBody.'
  ],
  [sha(3), '2026-10-22T09:00:00-05:00', 'dependabot[bot]', 'bot@github.com', '', 'Bump a thing', '']
]
  .map((fields) => `${fields.join('\u001f')}\u001e`)
  .join('\n');
test('git log output becomes a commit log, newest first, without bots', () => {
  const commits = parseLog(logOutput);
  assert.deepEqual(
    commits.map((c) => [c.sha, c.subject, c.by, c.agents, c.pr]),
    [
      [sha(2).slice(0, 12), 'Build the feature', 'agent', ['claude'], 4],
      [sha(1).slice(0, 12), 'Fix it', 'me', undefined, undefined]
    ]
  );
  assert.equal(commits[0].date, '2026-10-21T14:00:00.000Z');
  assert.throws(() => parseLog('not-a-sha\u001f2026-10-20\u001e'), /invalid commit/);
});

test('commit logs come from a credential-free, commits-only clone of a public repository', async () => {
  const calls: string[][] = [];
  const git: GitRunner = async (args) => {
    calls.push(args);
    if (args.includes('clone')) return '';
    if (args.includes('symbolic-ref')) return 'main\n';
    if (args.includes('for-each-ref')) return `v1.0\u001f2026-10-21T10:00:00-05:00\nbad tag name!\u001f2026-10-21\n`;
    if (args.at(-1) === 'packages/a') return `${sha(2)}\n`;
    return logOutput;
  };
  const observation = await observeCommits('owner/example', [null, 'packages/a'], git, fakeReader, now);
  const clone = calls.find((args) => args.includes('clone'))!;
  assert.deepEqual(clone.slice(0, 2), ['-c', 'credential.helper=']);
  assert.ok(clone.includes('--filter=blob:none'), 'a directory scope needs trees');
  assert.ok(clone.includes('https://github.com/owner/example.git'));
  assert.equal(observation.branch, 'main');
  assert.deepEqual(observation.commits[0].paths, ['packages/a']);
  assert.equal(observation.commits[1].paths, undefined);
  assert.deepEqual(observation.tags, [{ name: 'v1.0', date: '2026-10-21T15:00:00.000Z' }]);
  assert.equal(observationPath(observation), 'data/observations/commits/example.json');
  assert.doesNotMatch(JSON.stringify(observation), /thingelstad\.com|anthropic/, 'no email addresses');
  const unscoped: string[][] = [];
  await observeCommits('owner/example', [null], async (args) => (unscoped.push(args), git(args)), fakeReader, now);
  assert.ok(unscoped[0].includes('--filter=tree:0'), 'no scope, no trees');
  let cloned = false;
  await assert.rejects(
    observeCommits(
      'owner/example',
      [],
      async () => ((cloned = true), ''),
      async (e) => ({ ...((await fakeReader(e)) as object), private: true, visibility: 'private' }),
      now
    ),
    /public repositories/
  );
  assert.equal(cloned, false, 'a private repository is never cloned');
});

test('the publication log keeps every item its feed has carried', async () => {
  const feed = `<rss version="2.0"><channel><title>Blog</title>
<item><link>https://example.com/2026/10/20/a.html</link><description>&lt;p&gt;Card shop stop at &lt;a href="x"&gt;Spitty’s&lt;/a&gt; .&lt;/p&gt;</description><pubDate>Tue, 20 Oct 2026 12:00:00 GMT</pubDate></item>
<item><title>Titled &amp;amp; escaped</title><guid>tag:example.com,2026:1</guid><pubDate>Mon, 19 Oct 2026 12:00:00 GMT</pubDate></item>
<item><title>No date</title></item>
</channel></rss>`;
  assert.deepEqual(parseFeed(feed).entries, [
    {
      url: 'https://example.com/2026/10/20/a.html',
      title: null,
      excerpt: 'Card shop stop at Spitty’s.',
      date: '2026-10-20T12:00:00.000Z'
    },
    { url: null, id: 'tag:example.com,2026:1', title: 'Titled & escaped', date: '2026-10-19T12:00:00.000Z' }
  ]);
  assert.deepEqual(
    parseFeed(atom).entries.map((e) => e.title),
    ['One', 'Two']
  );
  assert.deepEqual(
    parseFeed(jsonFeed).entries.map((e) => [e.id, e.date]),
    [['1', '2026-08-02T15:00:00.000Z']]
  );
  const escaped = `<rss><channel><item><title>Hi &amp;lt;b&amp;gt;there&amp;lt;/b&amp;gt; &amp;#99999999;</title><pubDate>Tue, 20 Oct 2026 12:00:00 GMT</pubDate></item></channel></rss>`;
  assert.equal(parseFeed(escaped).entries[0].title, 'Hi there', 'markup escaped twice is still removed');
  const source = { url: 'https://example.com/', feed: 'https://example.com/feed.xml' };
  const first = await observePublications(source, async () => feed, undefined, now);
  assert.equal(first.items.length, 2);
  const later = feed.replace(/<item><link>.*?<\/item>/s, '').replace('Titled', 'Retitled');
  const second = await observePublications(source, async () => later, first, now);
  assert.deepEqual(
    second.items.map((i) => i.title ?? i.excerpt),
    ['Card shop stop at Spitty’s.', 'Retitled & escaped'],
    'an aged-out item stays; a changed item is updated in place'
  );
  const moved = await observePublications(
    { ...source, feed: 'https://example.com/new.xml' },
    async () => later,
    first,
    now
  );
  assert.equal(moved.items.length, 1, 'a different feed starts a new log');
  assert.equal(observationPath(second), 'data/observations/publications/example-com.json');
});
