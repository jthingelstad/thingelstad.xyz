// IndexNow (https://www.indexnow.org/documentation): after a deploy, tell Bing, Yandex, Seznam, Naver and Yep which
// pages changed in it. The key is public by design: it is served at /<key>.txt (site/outputs.11ty.js) so the
// engines can check that this site sent the ping. The key is shared with Jamie's other sites.
//
// "Changed" is decided by bytes, not by git: a page in the sitemap is changed when the bucket has no object at its
// key yet, or the object's ETag differs from the MD5 of the built file. The bucket uses SSE-S3 (AES256) and pages
// go up in single-part uploads, so a page's ETag is the MD5 of its bytes; a multipart ETag (with a "-") never
// matches and counts as changed. Only sitemap URLs on the canonical host are pinged, so the key file, feeds,
// Markdown twins, the 404 page and www never are.
//
// A ping never fails a deploy: every error is logged and swallowed. `node scripts/indexnow.mjs --dry-run
// [live.json]` prints what a deploy of the current _site/ would send, against a saved listing of the bucket
// ({ "<key>": "<etag>" }, or none to treat every page as new). It never sends anything.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const indexNowKey = '79f379d18599eeec9bebf34c9a2a5deb';
export const indexNowEndpoint = 'https://api.indexnow.org/indexnow';
const maxUrls = 10_000;

// The <loc>s of a sitemap.
export const sitemapUrls = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);

// The S3 key that serves a page URL on the canonical site (a directory URL serves its index.html), or null for
// any other host.
export function keyForUrl(url, siteUrl) {
  const page = new URL(url);
  const site = new URL(siteUrl);
  if (page.protocol !== site.protocol || page.host !== site.host) return null;
  const path = decodeURIComponent(page.pathname).replace(/^\//, '');
  return path === '' || path.endsWith('/') ? `${path}index.html` : path;
}

export const md5 = (bytes) => createHash('md5').update(bytes).digest('hex');

// Sitemap URLs whose built page is new or differs from the live object. `built` maps a key to the MD5 of the built
// file, `live` maps a key to its S3 ETag (quoted or not). A URL whose page was not built is left out.
export function changedUrls({ sitemapXml, siteUrl, built, live }) {
  const changed = [];
  for (const url of sitemapUrls(sitemapXml)) {
    const key = keyForUrl(url, siteUrl);
    if (key === null || !built.has(key)) continue;
    const etag = live.get(key)?.replaceAll('"', '');
    if (etag !== built.get(key)) changed.push(url);
  }
  return [...new Set(changed)].slice(0, maxUrls);
}

export function indexNowPayload(urls, siteUrl) {
  const site = new URL(siteUrl);
  return {
    host: site.host,
    key: indexNowKey,
    keyLocation: new URL(`/${indexNowKey}.txt`, site).href,
    urlList: urls.slice(0, maxUrls)
  };
}

// Send the ping. Returns a line for the log; never throws. Nothing is sent when no page changed.
export async function pingIndexNow(urls, siteUrl, { fetch = globalThis.fetch, dryRun = false } = {}) {
  if (urls.length === 0) return 'IndexNow: no page changed, nothing to send.';
  const payload = indexNowPayload(urls, siteUrl);
  if (dryRun)
    return `IndexNow (dry run): would send ${payload.urlList.length} URLs\n${JSON.stringify(payload, null, 2)}`;
  try {
    const response = await fetch(indexNowEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000)
    });
    return response.status === 200 || response.status === 202
      ? `IndexNow: ${payload.urlList.length} URLs accepted (${response.status}).`
      : `IndexNow: ping not accepted (${response.status}); the deploy carries on.`;
  } catch (error) {
    return `IndexNow: ping failed (${error instanceof Error ? error.message : error}); the deploy carries on.`;
  }
}

// MD5s of the built pages the sitemap names, keyed as in the bucket.
export function builtPageHashes(siteRoot, sitemapXml, siteUrl) {
  const built = new Map();
  for (const url of sitemapUrls(sitemapXml)) {
    const key = keyForUrl(url, siteUrl);
    if (key === null) continue;
    try {
      built.set(key, md5(readFileSync(`${siteRoot}/${key}`)));
    } catch {
      // Not built: left out of the ping.
    }
  }
  return built;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes('--dry-run')) throw new Error('Only --dry-run runs by hand; deploys ping.');
  const siteRoot = '_site';
  const { publishedUrl } = JSON.parse(readFileSync('infra/deployment.json', 'utf8'));
  const sitemapXml = readFileSync(`${siteRoot}/sitemap.xml`, 'utf8');
  const listing = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
  const live = new Map(Object.entries(listing ? JSON.parse(readFileSync(listing, 'utf8')) : {}));
  const urls = changedUrls({
    sitemapXml,
    siteUrl: publishedUrl,
    built: builtPageHashes(siteRoot, sitemapXml, publishedUrl),
    live
  });
  console.log(await pingIndexNow(urls, publishedUrl, { dryRun: true }));
}
