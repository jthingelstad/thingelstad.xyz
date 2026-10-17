// Public web observations: sitemap lastmod dates (modification evidence) and feed items (publishing evidence).
// Parsing is deliberately small and tolerant. Counts describe what the document contains, nothing more.
import type { FeedObservation, MonthCount, SitemapObservation, WebObservation } from '../schema';

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

export function parseFeed(text: string): { title: string | null; dates: string[]; items: number } {
  const body = text.trim();
  if (body.startsWith('{')) {
    const json = JSON.parse(body) as { title?: unknown; items?: unknown };
    const items = Array.isArray(json.items) ? json.items : [];
    const dates = items.flatMap((item) => {
      const value = item && typeof item === 'object' ? (item as Record<string, unknown>).date_published : undefined;
      const date = typeof value === 'string' ? isoDate(value) : null;
      return date ? [date] : [];
    });
    return { title: typeof json.title === 'string' ? json.title.slice(0, 200) : null, dates, items: items.length };
  }
  if (/<feed[\s>]/.test(body)) {
    const entries = elements(body, 'entry');
    const head = body.split(/<entry[\s>]/)[0];
    return {
      title: firstElement(head, 'title') ? decode(firstElement(head, 'title')!).slice(0, 200) : null,
      dates: entries.flatMap((e) => {
        const date = isoDate(firstElement(e, 'published') ?? firstElement(e, 'updated'));
        return date ? [date] : [];
      }),
      items: entries.length
    };
  }
  const items = elements(body, 'item');
  const head = body.split(/<item[\s>]/)[0];
  return {
    title: firstElement(head, 'title') ? decode(firstElement(head, 'title')!).slice(0, 200) : null,
    dates: items.flatMap((i) => {
      const date = isoDate(firstElement(i, 'pubDate') ?? firstElement(i, 'dc:date'));
      return date ? [date] : [];
    }),
    items: items.length
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
