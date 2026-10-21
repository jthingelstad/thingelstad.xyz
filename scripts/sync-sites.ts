// npm run sites:sync | npm run sites:check
// Vendors the canonical list of Jamie's sites, shared/sites.json in the thingelstad.com repository, into
// data/sites.json, which the build renders as the sites strip on every page (collection/sites-strip.ts).
// CI checks out only this repository, so the copy is committed.
//
//   npm run sites:sync    copy it from the sibling checkout, byte for byte
//   npm run sites:check   fail if the copy differs from it; part of npm run check
//
// SITES_SOURCE overrides the source path, relative to the repository root. The default is
// ../thingelstad.com/shared/sites.json, because this repository sits beside the thingelstad.com tree.
// Where that sibling is absent (CI, or a lone clone) the check says so and checks only the committed copy;
// a SITES_SOURCE that is missing fails.
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { parseSites, sitesPath, sitesStrip } from '../collection/sites-strip';

const sibling = '../thingelstad.com/shared/sites.json';

async function syncSites(check: boolean) {
  if (check && !process.env.SITES_SOURCE && !existsSync(sibling)) {
    sitesStrip(parseSites(await readFile(sitesPath, 'utf8')));
    return `${sibling} is not in this checkout, so ${sitesPath} was checked as committed, not for drift.`;
  }
  const source = process.env.SITES_SOURCE || sibling;
  const content = await readFile(source);
  const strip = sitesStrip(parseSites(content.toString('utf8'), source));
  if (!check) {
    await writeFile(sitesPath, content);
    return `Copied ${source} to ${sitesPath}: ${strip.length} sites in the strip.`;
  }
  const current = await readFile(sitesPath).catch(() => Buffer.alloc(0));
  if (!current.equals(content)) throw new Error(`${sitesPath} differs from ${source}. Run npm run sites:sync.`);
  return `${sitesPath} matches ${source}.`;
}

try {
  console.log(await syncSites(process.argv.includes('--check')));
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
}
