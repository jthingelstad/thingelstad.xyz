// Eleventy builds the static site from content/ and data/observations/ through the typed model in
// collection/site.ts. Run with tsx (`npm run site:build`) so the TypeScript modules load.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import markdownIt from 'markdown-it';
import {
  aliveBar,
  formatDate,
  lifespan,
  reach,
  screenshotAsset,
  sparkline,
  type SiteModel,
  type Timeline,
  type TimelineRow,
  type TimelineYear
} from '../collection/site';
import type { MonthCount, ScreenshotObservation } from '../collection/schema';
import { activitySummary, localDay, whoBar, yearColumns } from '../collection/activity';
import { connectionDiagram } from '../collection/diagram';
import { parseSites, siteRef, sitesPath } from '../collection/sites';
import { sitesStrip } from '../collection/sites-strip';
import { sharedTypeAssets, sharedTypeDir } from '../collection/shared-type';
import { writeSearchIndex } from '../collection/search-index';

const markdown = markdownIt({ html: false, linkify: true, typographer: true });

// Eleventy ships JSDoc types, not declarations; this is the slice of its config API the site uses.
type EleventyConfig = {
  addPassthroughCopy(mapping: Record<string, string>): void;
  addGlobalData(name: string, value: unknown): void;
  setLibrary(name: string, library: unknown): void;
  addFilter(name: string, filter: (...args: never[]) => unknown): void;
  on(event: 'eleventy.after', callback: (event: { directories: { output: string } }) => Promise<void>): void;
};

export default function (eleventyConfig: EleventyConfig) {
  // Everything under /assets/ is content-addressed and published with an immutable cache header; HTML
  // and the other top-level files are published with no-cache. The shared type (tokens.css and the fonts it
  // names relative to itself) goes up as one directory whose name hashes every file in it, so a font or token
  // change is a new name too (collection/shared-type.ts). The favicon keeps its /favicon.svg name and
  // carries the same content hash as ?v=, so browsers that hold on to an icon fetch a changed one.
  const hashed = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 10);
  const shared = sharedTypeAssets();
  const assets = {
    css: `/assets/site-${hashed('site/css/site.css')}.css`,
    search: `/assets/search-${hashed('site/js/search.js')}.js`,
    tokens: shared.tokens,
    fontPreloads: shared.preloads,
    favicon: hashed('public/favicon.svg')
  };
  eleventyConfig.addGlobalData('assets', assets);
  // From the vendored data/sites.json: the sites strip at the top of every page, the owner's
  // h-card in the footer and rel=me links in the head, and `ref`, which tags a link to another strip site
  // with ?ref=xyz-<placement> (`{{ url | ref("thing") }}`). Templates add refs; content text keeps its links.
  const sites = parseSites(readFileSync(sitesPath, 'utf8'));
  eleventyConfig.addGlobalData('sitesStrip', sitesStrip(sites.sites));
  eleventyConfig.addGlobalData('owner', sites.owner);
  eleventyConfig.addFilter('ref', siteRef(sites.sites));
  eleventyConfig.addPassthroughCopy({ 'public/favicon.svg': 'favicon.svg' });
  eleventyConfig.addPassthroughCopy({
    'site/css/site.css': assets.css.slice(1),
    'site/js/search.js': assets.search.slice(1),
    [sharedTypeDir]: shared.base.slice(1)
  });
  // Each front-page screenshot is published under /assets/ with its hash in the name (see screenshotAsset).
  const screenshots = 'data/observations/screenshot';
  for (const name of existsSync(screenshots) ? readdirSync(screenshots).filter((n) => n.endsWith('.json')) : []) {
    const shot = JSON.parse(readFileSync(`${screenshots}/${name}`, 'utf8')) as ScreenshotObservation;
    eleventyConfig.addPassthroughCopy({ [`${screenshots}/${shot.image}`]: screenshotAsset(shot).slice(1) });
  }
  // Each thing's artifacts are published beside its page, under their own names (/things/<id>/artifacts/<file>):
  // a link to one stays good for as long as the thing does. The loader has already checked every folder
  // against its record (collection/load.ts), so the folders are copied as they are, less the Finder's dotfiles.
  const artifacts = 'content/artifacts';
  const folders = existsSync(artifacts) ? readdirSync(artifacts, { withFileTypes: true }) : [];
  for (const id of folders.filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => e.name))
    for (const file of readdirSync(`${artifacts}/${id}`).filter((n) => !n.startsWith('.')))
      eleventyConfig.addPassthroughCopy({ [`${artifacts}/${id}/${file}`]: `things/${id}/artifacts/${file}` });
  eleventyConfig.setLibrary('md', markdown);
  eleventyConfig.addFilter('date', (value: string) => formatDate(value));
  eleventyConfig.addFilter('day', (value: string) => formatDate(value.slice(0, 10)));
  eleventyConfig.addFilter('md', (value: string) => markdown.render(value ?? ''));
  eleventyConfig.addFilter('sparkline', (months: MonthCount[], label: string, variant?: string) =>
    sparkline(months, label, variant)
  );
  eleventyConfig.addFilter('lifespan', (row: TimelineRow, timeline: Timeline) => lifespan(row, timeline));
  eleventyConfig.addFilter('aliveBar', (year: TimelineYear, timeline: Timeline) => aliveBar(year, timeline));
  eleventyConfig.addFilter('thing', (site: SiteModel, id: string) => site.things.find((t) => t.id === id));
  eleventyConfig.addFilter('displayUrl', (value: string) => value.replace(/^https:\/\//, '').replace(/\/$/, ''));
  eleventyConfig.addFilter('number', (value: number) => new Intl.NumberFormat('en-US').format(value));
  eleventyConfig.addFilter('reach', reach);
  eleventyConfig.addFilter('activitySummary', activitySummary);
  eleventyConfig.addFilter('localDay', localDay);
  eleventyConfig.addFilter('whoBar', whoBar);
  eleventyConfig.addFilter('yearColumns', yearColumns);
  eleventyConfig.addFilter('connectionDiagram', connectionDiagram);
  eleventyConfig.addFilter('languages', (languages: { name: string; bytes: number }[]) =>
    languages
      .slice(0, 3)
      .map((l) => l.name)
      .join(', ')
  );
  // Pagefind indexes the thing pages once they are written (collection/search-index.ts), for /search/. It reads
  // `directories.output`, where this build wrote, which --output changes; the older `dir` is only the config.
  eleventyConfig.on('eleventy.after', async ({ directories }) => {
    await writeSearchIndex(directories.output);
  });
  return {
    dir: { input: 'site', output: '_site', includes: '_includes', data: '_data' },
    templateFormats: ['njk', '11ty.js'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk'
  };
}
