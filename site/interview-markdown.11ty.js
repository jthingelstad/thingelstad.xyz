// Each interview session is also published as Markdown at /interviews/session-N.md.
import { sessionMarkdown } from '../collection/records.ts';

export const data = {
  pagination: { data: 'site.interviews', size: 1, alias: 'interview' },
  permalink: (data) => data.interview.markdown,
  eleventyExcludeFromCollections: true
};
export function render(data) {
  return sessionMarkdown(data.interview);
}
