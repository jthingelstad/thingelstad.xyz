// Public web observations: sitemap lastmod dates (modification evidence) and feed items (publishing evidence).
// Parsing is deliberately small and tolerant. Counts describe what the document contains, nothing more.
import type {
  FeedObservation,
  MonthCount,
  Publication,
  PublicationsObservation,
  SitemapObservation,
  WebObservation
} from '../schema';

export type TextFetcher = (url: string) => Promise<string>;
const maxBytes = 8_000_000;
export function defaultTextFetcher(fetcher = fetch): TextFetcher {
  return async (url) => {
    if (!url.startsWith('https://')) throw new Error('Only HTTPS sources are observed.');
    const response = await fetcher(url, {
      headers: {
        'User-Agent': 'thingelstad.xyz collector',
        Accept: 'application/xml, application/json, text/xml, */*'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(30_000)
    });
    if (!response.ok) throw new Error(`${response.status} for ${url}`);
    const text = await response.text();
    if (text.length > maxBytes) throw new Error(`${url} is larger than the collector reads.`);
    return text;
  };
}
const decode = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
const elements = (xml: string, name: string) =>
  [...xml.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'g'))].map((m) => m[1]);
const firstElement = (xml: string, name: string) => elements(xml, name)[0];
const isoDate = (value: string | undefined) => {
  if (!value) return null;
  const parsed = Date.parse(decode(value));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
};
export function monthCounts(dates: string[], now: Date, monthsBack = 12): MonthCount[] {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthsBack - 1), 1));
  const counts = new Map<string, number>();
  for (const date of dates) {
    if (date < start.toISOString() || date > now.toISOString()) continue;
    const month = date.slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));
}
const newest = (dates: string[]) => (dates.length ? dates.toSorted().at(-1)! : null);

export function parseSitemap(xml: string): { pages: { loc: string; lastmod: string | null }[]; children: string[] } {
  if (/<sitemapindex[\s>]/.test(xml))
    return {
      pages: [],
      children: elements(xml, 'sitemap').flatMap((s) =>
        firstElement(s, 'loc') ? [decode(firstElement(s, 'loc')!)] : []
      )
    };
  return {
    pages: elements(xml, 'url').flatMap((entry) => {
      const loc = firstElement(entry, 'loc');
      return loc ? [{ loc: decode(loc), lastmod: isoDate(firstElement(entry, 'lastmod')) }] : [];
    }),
    children: []
  };
}
async function observeSitemap(url: string, fetchText: TextFetcher, now: Date): Promise<SitemapObservation> {
  const maxChildren = 25;
  const root = parseSitemap(await fetchText(url));
  const pages = [...root.pages];
  const children = root.children.slice(0, maxChildren);
  for (const child of children) pages.push(...parseSitemap(await fetchText(child)).pages);
  const dates = pages.flatMap((p) => (p.lastmod ? [p.lastmod] : []));
  return {
    url,
    pages: pages.length,
    newestModified: newest(dates),
    months: monthCounts(dates, now),
    complete: root.children.length <= maxChildren
  };
}

// The words of an item, for the activity log: entities decoded (a feed's HTML arrives escaped, so twice),
// markup and whitespace gone. Tags are removed until none are left, so markup escaped once more than the
// rest cannot come through as a tag. The site escapes the words again wherever it shows them.
const blockTags = /<\/?(p|br|div|li|ul|ol|h[1-6]|blockquote|figure|figcaption|img)\b[^>]*>/gi;
const codePoint = (n: number) => (n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '');
const entities = (value: string) =>
  decode(value)
    .replace(/&#(\d+);/g, (_, n: string) => codePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => codePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ');
function plain(value: string) {
  let text = entities(entities(value).replace(blockTags, ' ')).replace(blockTags, ' ');
  for (let before = ''; before !== text;) {
    before = text;
    text = text.replace(/<[^>]*>/g, '');
  }
  return text
    .replace(/\p{Cc}+/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}
const cut = (value: string, max: number) => {
  if (value.length <= max) return value;
  const head = value.slice(0, max);
  return `${head.slice(0, head.lastIndexOf(' ') > max / 2 ? head.lastIndexOf(' ') : max).replace(/[\s,.;:]+$/, '')}…`;
};
const httpsUrl = (value: string | undefined) => {
  const url = value ? plain(value) : '';
  return /^https:\/\/[^\s]+$/.test(url) ? url.slice(0, 500) : null;
};
// An item as the activity log keeps it. A Micro.blog post has no title, so it keeps its opening words.
function publication(fields: {
  url?: string;
  id?: string;
  title?: string;
  text?: string;
  date: string | null;
}): Publication | null {
  if (!fields.date) return null;
  const title = fields.title ? cut(plain(fields.title), 200) : '';
  const url = httpsUrl(fields.url);
  const excerpt = !title && fields.text ? cut(plain(fields.text), 100) : '';
  const id = !url && fields.id ? cut(plain(fields.id), 300) : '';
  return {
    url,
    ...(id ? { id } : {}),
    title: title || null,
    ...(excerpt ? { excerpt } : {}),
    date: fields.date
  };
}
const present = (item: Publication | null): item is Publication => item !== null;

export function parseFeed(text: string): {
  title: string | null;
  dates: string[];
  items: number;
  entries: Publication[];
} {
  const body = text.trim();
  if (body.startsWith('{')) {
    const json = JSON.parse(body) as { title?: unknown; items?: unknown };
    const items = Array.isArray(json.items) ? json.items : [];
    const entries = items
      .map((raw) => {
        const item = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
        const string = (key: string) => (typeof item[key] === 'string' ? (item[key] as string) : undefined);
        return publication({
          url: string('url'),
          id: string('id'),
          title: string('title'),
          text: string('content_text') ?? string('summary') ?? string('content_html'),
          date: isoDate(string('date_published'))
        });
      })
      .filter(present);
    return {
      title: typeof json.title === 'string' ? json.title.slice(0, 200) : null,
      dates: entries.map((e) => e.date),
      items: items.length,
      entries
    };
  }
  if (/<feed[\s>]/.test(body)) {
    const raw = [...body.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/g)].map((m) => m[1]);
    const head = body.split(/<entry[\s>]/)[0];
    const entries = raw
      .map((e) => {
        const links = [...e.matchAll(/<link\s([^>]*)\/?>/g)].map((m) => m[1]);
        const alternate = links.find((l) => !/rel="(?!alternate")/.test(l)) ?? links[0];
        return publication({
          url: alternate ? /href="([^"]+)"/.exec(alternate)?.[1] : undefined,
          id: firstElement(e, 'id'),
          title: firstElement(e, 'title'),
          text: firstElement(e, 'summary') ?? firstElement(e, 'content'),
          date: isoDate(firstElement(e, 'published') ?? firstElement(e, 'updated'))
        });
      })
      .filter(present);
    return {
      title: firstElement(head, 'title') ? decode(firstElement(head, 'title')!).slice(0, 200) : null,
      dates: entries.map((e) => e.date),
      items: raw.length,
      entries
    };
  }
  const raw = elements(body, 'item');
  const head = body.split(/<item[\s>]/)[0];
  const entries = raw
    .map((i) =>
      publication({
        url: firstElement(i, 'link'),
        id: firstElement(i, 'guid'),
        title: firstElement(i, 'title'),
        text: firstElement(i, 'description') ?? firstElement(i, 'content:encoded'),
        date: isoDate(firstElement(i, 'pubDate') ?? firstElement(i, 'dc:date'))
      })
    )
    .filter(present);
  return {
    title: firstElement(head, 'title') ? decode(firstElement(head, 'title')!).slice(0, 200) : null,
    dates: entries.map((e) => e.date),
    items: raw.length,
    entries
  };
}
async function observeFeed(url: string, fetchText: TextFetcher, now: Date): Promise<FeedObservation> {
  const feed = parseFeed(await fetchText(url));
  return {
    url,
    title: feed.title,
    items: feed.items,
    newestPublished: newest(feed.dates),
    months: monthCounts(feed.dates, now)
  };
}
export async function observeWebsite(
  source: { url: string; sitemap?: string; feed?: string },
  fetchText: TextFetcher,
  now = new Date()
): Promise<WebObservation> {
  return {
    kind: 'web',
    url: source.url,
    observedAt: now.toISOString(),
    sitemap: source.sitemap ? await observeSitemap(source.sitemap, fetchText, now) : null,
    feed: source.feed ? await observeFeed(source.feed, fetchText, now) : null
  };
}

// The publication log: every item the feed carries now, plus every item an earlier run kept. An item that
// ages out of the feed stays; one the feed still carries is refreshed, so a corrected title is kept.
const publicationKey = (item: Publication) => item.url ?? item.id ?? `${item.date} ${item.title ?? ''}`;
export async function observePublications(
  source: { url: string; feed: string },
  fetchText: TextFetcher,
  previous: PublicationsObservation | undefined,
  now = new Date()
): Promise<PublicationsObservation> {
  const { entries } = parseFeed(await fetchText(source.feed));
  const items = new Map((previous?.feed === source.feed ? previous.items : []).map((i) => [publicationKey(i), i]));
  for (const item of entries) items.set(publicationKey(item), item);
  return {
    kind: 'publications',
    url: source.url,
    feed: source.feed,
    observedAt: now.toISOString(),
    items: [...items.values()].toSorted(
      (a, b) => b.date.localeCompare(a.date) || publicationKey(a).localeCompare(publicationKey(b))
    )
  };
}
