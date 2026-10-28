// The machine-readable outputs: feeds of the ledger and of activity, llms.txt, and the things.json ingestion surface.
import { activityRss, jsonFeed, llmsFullText, llmsText, rssFeed, thingsJson } from '../collection/site.ts';
import { indexNowKey } from '../scripts/indexnow.mjs';
import { gitFileDates, sitemapEntries, sitemapXml } from '../collection/lastmod.ts';

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
  // Every page the header links, then each thing and topic, each with the date its content last changed
  // (collection/lastmod.ts).
  '/sitemap.xml': (site) => sitemapXml(sitemapEntries(site, gitFileDates()))
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
