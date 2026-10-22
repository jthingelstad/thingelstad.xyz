// The type Jamie's sites share: thingelstad.com's shared/tokens.css (Inter and Inter Tight, the --jt- sizes,
// the frame and the site colours) and shared/fonts/ (the variable woff2 files and their OFL licences).
// site/css/shared/ is a byte-for-byte copy, vendored with data/sites.json by `npm run sites:sync` and never
// edited here. tokens.css names its fonts relative to itself (fonts/...), so the build publishes the whole
// directory as one unit under /assets/shared-<hash>/, the hash covering every file: a change to any of them is
// a new directory, which the immutable cache on /assets/ needs.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const sharedTypeDir = 'site/css/shared';

// The files of the shared type in a shared/ directory (or the vendored copy), relative to it, sorted:
// tokens.css and the woff2 and licence files in fonts/.
export function sharedTypeFiles(dir: string) {
  const fonts = existsSync(join(dir, 'fonts')) ? readdirSync(join(dir, 'fonts')) : [];
  return ['tokens.css', ...fonts.filter((name) => /\.(woff2|txt)$/.test(name)).map((name) => `fonts/${name}`)].sort();
}

// Every file under the vendored directory, relative to it, dotfiles aside: what the build would publish.
export function vendoredFiles(dir = sharedTypeDir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => join(entry.parentPath, entry.name).slice(dir.length + 1))
    .sort();
}

// The font files tokens.css loads, as paths relative to it (fonts/inter-latin-wght-normal.woff2).
export const fontsNamedBy = (tokens: string) => [
  ...new Set([...tokens.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]))
];

// The published directory: /assets/shared-<first ten hex of a SHA-256 over every file's path and bytes>/.
export function sharedTypeAssets(dir = sharedTypeDir) {
  const files = vendoredFiles(dir);
  if (!files.includes('tokens.css')) throw new Error(`${dir}/tokens.css is missing. Run npm run sites:sync.`);
  const hash = createHash('sha256');
  for (const file of files) hash.update(`${file}\0`).update(readFileSync(join(dir, file)));
  const base = `/assets/shared-${hash.digest('hex').slice(0, 10)}`;
  return {
    base,
    tokens: `${base}/tokens.css`,
    // The two faces every page uses first, preloaded: Inter and Inter Tight, latin, upright.
    preloads: ['inter-latin-wght-normal.woff2', 'inter-tight-latin-wght-normal.woff2'].map(
      (name) => `${base}/fonts/${name}`
    )
  };
}
