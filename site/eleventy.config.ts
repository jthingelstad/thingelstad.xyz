// Eleventy builds the static site from content/ and data/observations/ through the typed model in
// collection/site.ts. Run with tsx (`npm run site:build`) so the TypeScript modules load.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import markdownIt from 'markdown-it';
import { formatDate, reach, sparkline, timelineSvg, type SiteModel, type Timeline } from '../collection/site';
import type { MonthCount } from '../collection/schema';
import { connectionDiagram } from '../collection/diagram';

const markdown = markdownIt({ html: false, linkify: true, typographer: true });

// Eleventy ships JSDoc types, not declarations; this is the slice of its config API the site uses.
type EleventyConfig = {
  addPassthroughCopy(mapping: Record<string, string>): void;
  addGlobalData(name: string, value: unknown): void;
  setLibrary(name: string, library: unknown): void;
  addFilter(name: string, filter: (...args: never[]) => unknown): void;
};

export default function (eleventyConfig: EleventyConfig) {
  // Everything under /assets/ is content-addressed and published with an immutable cache header; HTML
  // and the other top-level files are published with no-cache. The stylesheet refers to the fonts by
  // their versioned names, so a font change is a new name too.
  const hashed = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 10);
  const assets = {
    css: `/assets/site-${hashed('site/css/site.css')}.css`,
    timeline: `/assets/timeline-${hashed('site/js/timeline.js')}.js`
  };
  eleventyConfig.addGlobalData('assets', assets);
  eleventyConfig.addPassthroughCopy({ 'public/favicon.svg': 'favicon.svg' });
  eleventyConfig.addPassthroughCopy({
    'site/css/site.css': assets.css.slice(1),
    'site/js/timeline.js': assets.timeline.slice(1),
    'node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2': 'assets/fonts/inter-latin-400-normal.woff2',
    'node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2': 'assets/fonts/inter-latin-500-normal.woff2',
    'node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2': 'assets/fonts/inter-latin-600-normal.woff2',
    'node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2':
      'assets/fonts/fraunces-latin-full-normal.woff2'
  });
  eleventyConfig.setLibrary('md', markdown);
  eleventyConfig.addFilter('date', (value: string) => formatDate(value));
  eleventyConfig.addFilter('day', (value: string) => formatDate(value.slice(0, 10)));
  eleventyConfig.addFilter('md', (value: string) => markdown.render(value ?? ''));
  eleventyConfig.addFilter('sparkline', (months: MonthCount[], label: string) => sparkline(months, label));
  eleventyConfig.addFilter('timeline', (timeline: Timeline) => timelineSvg(timeline));
  eleventyConfig.addFilter('thing', (site: SiteModel, id: string) => site.things.find((t) => t.id === id));
  eleventyConfig.addFilter('number', (value: number) => new Intl.NumberFormat('en-US').format(value));
  eleventyConfig.addFilter('reach', reach);
  eleventyConfig.addFilter('connectionDiagram', connectionDiagram);
  eleventyConfig.addFilter('languages', (languages: { name: string; bytes: number }[]) =>
    languages
      .slice(0, 3)
      .map((l) => l.name)
      .join(', ')
  );
  return {
    dir: { input: 'site', output: '_site', includes: '_includes', data: '_data' },
    templateFormats: ['njk', '11ty.js'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk'
  };
}
