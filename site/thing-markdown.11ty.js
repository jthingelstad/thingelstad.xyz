// Each thing is also published as Markdown at /things/<id>.md, the twin llms.txt links to.
import { thingMarkdown } from '../collection/site.ts';

export const data = {
  pagination: { data: 'site.things', size: 1, alias: 'thing' },
  permalink: (data) => data.thing.markdown,
  eleventyExcludeFromCollections: true
};
export function render(data) {
  return thingMarkdown(data.thing);
}
