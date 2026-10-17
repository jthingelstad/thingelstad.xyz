// The machine-readable outputs: feeds of the ledger, llms.txt, and the things.json ingestion surface.
import { jsonFeed, llmsFullText, llmsText, rssFeed, thingsJson } from '../collection/site.ts';

const outputs = {
  '/feed.xml': (site) => rssFeed(site),
  '/feed.json': (site) => JSON.stringify(jsonFeed(site), null, 2),
  '/llms.txt': (site) => llmsText(site),
  '/llms-full.txt': (site) => llmsFullText(site),
  '/things.json': (site) => JSON.stringify(thingsJson(site), null, 2),
  '/robots.txt': (site) => `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`,
  '/sitemap.xml': (site) => {
    const pages = [
      '/',
      '/topics/',
      '/history/',
      '/timeline/',
      ...site.things.map((t) => t.page),
      ...site.topics.map((t) => t.page)
    ];
    return `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
      .map((p) => `  <url><loc>${site.url}${p}</loc></url>`)
      .join('\n')}\n</urlset>\n`;
  }
};

export const data = {
  pagination: { data: 'outputs', size: 1, alias: 'output' },
  outputs: Object.keys(outputs),
  permalink: (data) => data.output,
  eleventyExcludeFromCollections: true
};
export function render(data) {
  return outputs[data.output](data.site);
}
