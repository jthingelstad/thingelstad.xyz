// npm run sites:sync | npm run sites:check
// Vendors two things from the thingelstad.com repository's shared/ directory, byte for byte:
// - shared/sites.json, the canonical list of Jamie's sites, into data/sites.json, which the build renders as the
//   sites strip, the footer h-card and the rel=me links on every page (collection/sites.ts);
// - shared/tokens.css and shared/fonts/, the type Jamie's sites share, into site/css/shared/, which the build
//   publishes under /assets/shared-<hash>/ (collection/shared-type.ts).
// CI checks out only this repository, so the copies are committed.
//
//   npm run sites:sync    copy them from the sibling checkout, and remove vendored type files shared/ no longer has
//   npm run sites:check   fail on a stale, missing or leftover copy; part of npm run check
//
// SITES_SOURCE overrides the sites.json source path, relative to the repository root; the type is read from the
// same directory. The default is ../thingelstad.com/shared/sites.json, because this repository sits beside the
// thingelstad.com tree. Where that sibling is absent (CI, or a lone clone) the check says so and checks only the
// committed copies: sites.json parses, and every font tokens.css names is vendored beside it with nothing else.
// A SITES_SOURCE that is missing fails.
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseSites, sitesPath } from '../collection/sites';
import { sitesStrip } from '../collection/sites-strip';
import { fontsNamedBy, sharedTypeDir, sharedTypeFiles, vendoredFiles } from '../collection/shared-type';

const sibling = '../thingelstad.com/shared/sites.json';
const licence = /^fonts\/OFL-[\w-]+\.txt$/;

// Without the sibling: the committed tokens.css loads only fonts that are vendored, and every vendored file is
// tokens.css, a font it loads, or a licence.
async function checkCommittedType() {
  const tokens = await readFile(join(sharedTypeDir, 'tokens.css'), 'utf8').catch(() => null);
  if (tokens === null) throw new Error(`${sharedTypeDir}/tokens.css is missing. Run npm run sites:sync.`);
  const named = fontsNamedBy(tokens);
  const have = vendoredFiles();
  const missing = named.filter((font) => !have.includes(font));
  if (missing.length) throw new Error(`${sharedTypeDir} is missing ${missing.join(', ')}. Run npm run sites:sync.`);
  const leftover = have.filter((file) => file !== 'tokens.css' && !named.includes(file) && !licence.test(file));
  if (leftover.length) throw new Error(`${sharedTypeDir} has ${leftover.join(', ')}, which tokens.css never loads.`);
  return named.length;
}

async function syncSites(check: boolean) {
  if (check && !process.env.SITES_SOURCE && !existsSync(sibling)) {
    sitesStrip(parseSites(await readFile(sitesPath, 'utf8')).sites);
    const fonts = await checkCommittedType();
    return (
      `${dirname(sibling)} is not in this checkout, so ${sitesPath} and ${sharedTypeDir} were checked as ` +
      `committed, not for drift (${fonts} fonts, each vendored).`
    );
  }
  const source = process.env.SITES_SOURCE || sibling;
  const sharedDir = dirname(source);
  const content = await readFile(source);
  const strip = sitesStrip(parseSites(content.toString('utf8'), source).sites);
  if (!existsSync(join(sharedDir, 'tokens.css'))) throw new Error(`${sharedDir} has no tokens.css.`);
  const typeFiles = sharedTypeFiles(sharedDir);
  const leftover = vendoredFiles().filter((file) => !typeFiles.includes(file));
  if (!check) {
    await writeFile(sitesPath, content);
    await mkdir(join(sharedTypeDir, 'fonts'), { recursive: true });
    for (const file of typeFiles) await writeFile(join(sharedTypeDir, file), await readFile(join(sharedDir, file)));
    for (const file of leftover) await rm(join(sharedTypeDir, file));
    return (
      `Copied ${source} to ${sitesPath} (${strip.length} sites in the strip) and ${typeFiles.length} shared type ` +
      `files to ${sharedTypeDir}${leftover.length ? `, removing ${leftover.join(', ')}` : ''}.`
    );
  }
  const current = await readFile(sitesPath).catch(() => Buffer.alloc(0));
  if (!current.equals(content)) throw new Error(`${sitesPath} differs from ${source}. Run npm run sites:sync.`);
  for (const file of typeFiles) {
    const [want, have] = await Promise.all([
      readFile(join(sharedDir, file)),
      readFile(join(sharedTypeDir, file)).catch(() => null)
    ]);
    if (!have) throw new Error(`${sharedTypeDir}/${file} is missing. Run npm run sites:sync.`);
    if (!want.equals(have))
      throw new Error(`${sharedTypeDir}/${file} differs from ${sharedDir}. Run npm run sites:sync.`);
  }
  if (leftover.length) {
    throw new Error(
      `${sharedTypeDir} has ${leftover.join(', ')}, which ${sharedDir} does not. Run npm run sites:sync.`
    );
  }
  return `${sitesPath} and the ${typeFiles.length} files in ${sharedTypeDir} match ${sharedDir}.`;
}

try {
  console.log(await syncSites(process.argv.includes('--check')));
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
}
