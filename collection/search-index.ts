// The search index behind /search/. After Eleventy writes the site, Pagefind reads the thing pages (and only
// them) and writes its index to /pagefind/ beside them, replacing the last one. What a page offers the index is
// marked in site/thing.njk: the article is the body, and the facts, evidence and diagrams are left out. The
// index files are content-hashed by Pagefind; its scripts and wasm are not.
import { rmSync } from 'node:fs';
import * as pagefind from 'pagefind';

const searchGlob = 'things/*/index.html';

export async function writeSearchIndex(output: string) {
  const { index, errors } = await pagefind.createIndex({ forceLanguage: 'en' });
  try {
    if (!index) throw new Error(`Pagefind could not start: ${errors.join('; ')}`);
    const added = await index.addDirectory({ path: output, glob: searchGlob });
    if (added.errors.length || !added.page_count)
      throw new Error(`Pagefind indexed ${added.page_count} pages: ${added.errors.join('; ')}`);
    rmSync(`${output}/pagefind`, { recursive: true, force: true });
    const written = await index.writeFiles({ outputPath: `${output}/pagefind` });
    if (written.errors.length) throw new Error(`Pagefind could not write: ${written.errors.join('; ')}`);
    return added.page_count;
  } finally {
    await pagefind.close();
  }
}
