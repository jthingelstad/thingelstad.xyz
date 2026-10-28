// The machine-readable outputs: feeds of the ledger and of activity, llms.txt, and the things.json ingestion surface.
import { activityRss, jsonFeed, llmsFullText, llmsText, rssFeed, thingsJson } from '../collection/site.ts';
import { indexNowKey } from '../scripts/indexnow.mjs';

const outputs = {
  '/feed.xml': (site) => rssFeed(site),
  '/feed.json': (site) => JSON.stringify(jsonFeed(site), null, 2),
  '/activity.xml': (site) => activityRss(site),
  '/llms.txt': (site) => llmsText(site),
  '/llms-full.txt': (site) => llmsFullText(site),
  '/things.json': (site) => JSON.stringify(thingsJson(site), null, 2),
  // The IndexNow key file (scripts/indexnow.mjs): its body is exactly the key. It is in no sitemap, feed or index.
  [`/${indexNowKey}.txt`]: () => indexNowKey,
  '/robots.txt': (site) => `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`,
  // Every page the header links, then each thing and topic. /search/ lists every thing without JavaScript, so
  // it is a page worth indexing; its filtered addresses (?status=...) are the same page and stay out.
  '/sitemap.xml': (site) => {
    const pages = [
      '/',
      '/topics/',
      '/history/',
      '/activity/',
      '/timeline/',
      '/search/',
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
