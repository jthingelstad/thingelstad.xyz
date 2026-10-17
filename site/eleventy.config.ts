// Eleventy builds the static site from content/ and data/observations/ through the typed model in
// collection/site.ts. Run with tsx (`npm run site:build`) so the TypeScript modules load.
import markdownIt from 'markdown-it';
import { formatDate, sparkline, timelineSvg, type SiteModel, type Timeline } from '../collection/site';
import type { MonthCount } from '../collection/schema';

const markdown = markdownIt({ html: false, linkify: true, typographer: true });

// Eleventy ships JSDoc types, not declarations; this is the slice of its config API the site uses.
type EleventyConfig = {
  addPassthroughCopy(mapping: Record<string, string>): void;
  setLibrary(name: string, library: unknown): void;
  addFilter(name: string, filter: (...args: never[]) => unknown): void;
};

export default function (eleventyConfig: EleventyConfig) {
  eleventyConfig.addPassthroughCopy({ 'public/favicon.svg': 'favicon.svg' });
  eleventyConfig.addPassthroughCopy({ 'site/css': 'css', 'site/js': 'js' });
  eleventyConfig.addPassthroughCopy({
    'node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2': 'fonts/inter-latin-400-normal.woff2',
    'node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2': 'fonts/inter-latin-500-normal.woff2',
    'node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2': 'fonts/inter-latin-600-normal.woff2'
  });
  eleventyConfig.setLibrary('md', markdown);
  eleventyConfig.addFilter('date', (value: string) => formatDate(value));
  eleventyConfig.addFilter('day', (value: string) => formatDate(value.slice(0, 10)));
  eleventyConfig.addFilter('md', (value: string) => markdown.render(value ?? ''));
  eleventyConfig.addFilter('sparkline', (months: MonthCount[], label: string) => sparkline(months, label));
  eleventyConfig.addFilter('timeline', (timeline: Timeline) => timelineSvg(timeline));
  eleventyConfig.addFilter('thing', (site: SiteModel, id: string) => site.things.find((t) => t.id === id));
  eleventyConfig.addFilter('number', (value: number) => new Intl.NumberFormat('en-US').format(value));
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
