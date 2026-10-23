// How the built site is published to S3. Everything under assets/ is content-addressed and immutable, and so
// are the search index's own files under pagefind/, which Pagefind names by their content; everything else is
// revalidated on each request. Content-named files go up first, pages after the files they refer to, and the
// front page last, so a half-finished publish never shows a page whose stylesheet or index is missing.
import { readdirSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

export const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  // The search index. Pagefind gzips these itself and reads them as bytes, so they are stored as they are.
  '.pagefind': 'application/octet-stream',
  '.pf_meta': 'application/octet-stream',
  '.pf_index': 'application/octet-stream',
  '.pf_fragment': 'application/octet-stream',
  '.pf_filter': 'application/octet-stream'
};
export const immutable = 'public,max-age=31536000,immutable';
export const revalidate = 'no-cache';

export function contentTypeFor(key) {
  const type = contentTypes[extname(key)];
  if (!type) throw new Error(`No content type for ${key}`);
  return type;
}

// Pagefind's scripts, wasm and entry file keep their names, so they are revalidated like pages.
const contentNamed = (key) => key.startsWith('assets/') || /^pagefind\/.+\.pf_(meta|index|fragment|filter)$/.test(key);
export const cacheControlFor = (key) => (contentNamed(key) ? immutable : revalidate);

// Keys of every file under `root`, as S3 keys (forward slashes), in publish order.
export function publishOrder(root) {
  const keys = readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join('/'));
  const rank = (key) => (contentNamed(key) ? 0 : key === 'index.html' ? 3 : key.endsWith('.html') ? 2 : 1);
  return keys.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
