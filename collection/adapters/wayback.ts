// Internet Archive observations: the days the Wayback Machine captured a source URL with a 200
// response. The first capture is evidence a site existed by then, not a launch date. Later captures
// can be of someone else's page once a domain lapses, so the latest capture is kept as data only.
import type { WaybackObservation } from '../schema';
import type { TextFetcher } from './web';

const wrapped = /^https:\/\/web\.archive\.org\/web\/\d{1,14}[a-z_]*\/(https?:\/\/.+)$/;
// The URL whose captures a source stands for: a Wayback link stands for the page it captured.
export function capturedUrl(url: string) {
  return url.match(wrapped)?.[1] ?? url;
}
const day = (timestamp: string) => `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`;
export async function observeCaptures(
  url: string,
  fetchText: TextFetcher,
  now = new Date()
): Promise<WaybackObservation> {
  const query = new URLSearchParams({
    url,
    output: 'json',
    fl: 'timestamp',
    collapse: 'timestamp:8', // one row per day
    filter: 'statuscode:200'
  });
  const rows: unknown = JSON.parse((await fetchText(`https://web.archive.org/cdx/search/cdx?${query}`)) || '[]');
  if (!Array.isArray(rows)) throw new Error('Unexpected Wayback response.');
  const days = rows
    .slice(1)
    .map((row) => (Array.isArray(row) ? row[0] : null))
    .filter((t): t is string => typeof t === 'string' && /^\d{14}$/.test(t))
    .map(day)
    .toSorted();
  const years = new Map<string, number>();
  for (const d of days) years.set(d.slice(0, 4), (years.get(d.slice(0, 4)) ?? 0) + 1);
  return {
    kind: 'wayback',
    url,
    observedAt: now.toISOString(),
    firstCapture: days[0] ?? null,
    latestCapture: days.at(-1) ?? null,
    years: [...years].map(([year, count]) => ({ year, days: count }))
  };
}
