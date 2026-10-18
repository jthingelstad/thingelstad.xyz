// Tinylytics observations: human page views per month for a site Jamie tracks there. Crawlers are not
// counted. Visits are reach, not activity: they say people came, not that the thing changed.
import type { MonthCount, TinylyticsObservation } from '../schema';

export type TinylyticsReader = (endpoint: string) => Promise<unknown>;
export type TinylyticsSite = { id: number; url: string };

// Returns null without a key, so the collector skips Tinylytics instead of failing.
export function defaultTinylyticsReader(environment = process.env, fetcher = fetch): TinylyticsReader | null {
  const key = environment.TINYLYTICS_API_KEY;
  if (!key) return null;
  return async (endpoint) => {
    const response = await fetcher(`https://tinylytics.app/api/v1/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
        'User-Agent': 'thingelstad.xyz collector'
      },
      signal: AbortSignal.timeout(30_000)
    });
    if (!response.ok) throw new Error(`Tinylytics returned ${response.status} for ${endpoint.split('?')[0]}.`);
    return response.json();
  };
}
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const count = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid hit count.');
  return value;
};
// A site and a website source match when they share a root, ignoring a leading www., and the source is
// that root, so a page inside a larger site never takes the whole site's traffic.
export function rootOrigin(url: string) {
  const parsed = new URL(url);
  return parsed.protocol === 'https:' && (parsed.pathname === '/' || parsed.pathname === '') && !parsed.search
    ? parsed.origin
    : null;
}
export const siteKey = (origin: string) => origin.replace('://www.', '://');
export async function listSites(reader: TinylyticsReader): Promise<TinylyticsSite[]> {
  const response = await reader('sites');
  if (!isRecord(response) || !Array.isArray(response.sites)) throw new Error('Unexpected Tinylytics sites response.');
  return response.sites
    .filter(isRecord)
    .filter((site) => Number.isSafeInteger(site.id) && typeof site.url === 'string')
    .map((site) => ({ id: site.id as number, url: site.url as string }));
}
export async function observeSite(
  site: TinylyticsSite,
  reader: TinylyticsReader,
  now = new Date()
): Promise<TinylyticsObservation> {
  const origin = rootOrigin(site.url);
  if (!origin) throw new Error('Only HTTPS sites are observed.');
  const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)).toISOString().slice(0, 10);
  const until = now.toISOString().slice(0, 10);
  const response = await reader(
    `sites/${site.id}/hits?grouped=true&group_by=date&interval=month&start_date=${since}&end_date=${until}`
  );
  if (!isRecord(response) || !Array.isArray(response.grouped_hits) || !isRecord(response.summary))
    throw new Error('Unexpected Tinylytics hits response.');
  const months: MonthCount[] = response.grouped_hits.filter(isRecord).map((row) => {
    if (typeof row.date !== 'string' || !/^\d{4}-\d{2}/.test(row.date)) throw new Error('Invalid hit month.');
    return { month: row.date.slice(0, 7), count: count(row.hit_count) };
  });
  return {
    kind: 'tinylytics',
    url: `${origin}/`,
    observedAt: now.toISOString(),
    since,
    until,
    hits: count(response.summary.total_hits),
    months
  };
}
