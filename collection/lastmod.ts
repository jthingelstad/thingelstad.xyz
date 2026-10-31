// The sitemap's <lastmod> for every page: when the page's content last really changed, never when it was built.
// A thing's page changes when its record or artifacts change (the newest commit touching content/things/<id>.md
// or content/artifacts/<id>/), when a history event about it is dated, and when its newest evidence is (the
// latest commit, publication or page change the page shows). A page that lists things (the front page, a topic,
// search, the timeline) changed when the newest of them did, or when its own file did (featured.yaml,
// topics.yaml). /history/ changed with the history files and its newest event, /activity/ with its newest entry.
// Daily counters (page views, stars) are not counted: they move every collection and are not the page's content.
import { execFileSync } from 'node:child_process';
import { toInstant, type SiteModel } from './site.ts';

// The commit date of a content file, as an instant, or null when git has none (a file not yet committed).
export type FileDate = (path: string) => string | null;

// The newest commit date of every file under content/, and of the pages written by hand under site/ (the about
// page), from one `git log` pass. A shallow clone would date every
// file by its one commit, so it is refused: CI checks out the full history (fetch-depth: 0).
export function gitFileDates(root = process.cwd()): FileDate {
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 });
  if (git('rev-parse', '--is-shallow-repository').trim() === 'true')
    throw new Error('The sitemap dates pages by their git history; fetch the full history (fetch-depth: 0).');
  const dates = new Map<string, string>();
  let current = '';
  for (const line of git(
    'log',
    '--format=@%cI',
    '--name-only',
    '--no-renames',
    '--',
    'content',
    'site/about.njk'
  ).split('\n')) {
    if (line.startsWith('@')) current = line.slice(1);
    else if (line && !dates.has(line)) dates.set(line, current); // newest first, so the first date is the latest
  }
  return (path: string) => {
    if (dates.has(path)) return dates.get(path) ?? null;
    let newest: string | null = null; // a folder: its newest file
    for (const [file, date] of dates) if (file.startsWith(`${path}/`)) newest = latest([newest, date]);
    return newest;
  };
}

// W3C datetime in UTC, to the second. A date with no time (YYYY, YYYY-MM, YYYY-MM-DD) is noon UTC of its start,
// as the feeds have it.
export function w3c(date: string) {
  const instant = /^\d{4}(-\d{2}){0,2}$/.test(date) ? toInstant(date) : date;
  const ms = Date.parse(instant);
  if (Number.isNaN(ms)) throw new Error(`Not a date: ${date}`);
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
}
function latest(dates: (string | null | undefined)[]): string | null {
  let best: string | null = null;
  for (const date of dates) if (date && (!best || Date.parse(w3c(date)) > Date.parse(w3c(best)))) best = date;
  return best;
}

export type SitemapEntry = { loc: string; lastmod: string };

// Every page the header links, then each thing and topic. /search/ lists every thing without JavaScript, so it is
// a page worth indexing; its filtered addresses (?status=...) are the same page and stay out.
export function sitemapEntries(model: SiteModel, fileDate: FileDate): SitemapEntry[] {
  const thingDates = new Map(
    model.things.map((thing) => [
      thing.id,
      latest([
        fileDate(`content/things/${thing.id}.md`),
        fileDate(`content/artifacts/${thing.id}`),
        thing.latest?.date,
        ...thing.events.map((event) => event.date)
      ])
    ])
  );
  const allThings = latest([...thingDates.values()]);
  const topicDates = model.topics.map((topic) => ({
    page: topic.page,
    date: latest([fileDate('content/topics.yaml'), ...topic.things.map((thing) => thingDates.get(thing.id))])
  }));
  const history = latest([fileDate('content/history'), ...model.history.map((event) => event.date)]);
  const activity = latest([
    ...model.activity.days.map((day) => day.last),
    ...model.activity.weeks.flatMap((week) => week.things.map((thing) => thing.last))
  ]);
  const storyDates = model.stories.map((story) => ({
    page: story.page,
    date: latest([fileDate(`content/stories/${story.id}.md`), ...story.cast.map((thing) => thingDates.get(thing.id))])
  }));
  const pages: [string, string | null][] = [
    ['/', latest([allThings, fileDate('content/featured.yaml')])],
    ['/topics/', latest(topicDates.map((topic) => topic.date))],
    ['/history/', history],
    ['/activity/', activity],
    ['/timeline/', latest([allThings, history])],
    ['/search/', allThings],
    ['/about/', latest([fileDate('site/about.njk'), fileDate('content/things/things-ive-built.md')])],
    ...(storyDates.length
      ? [['/stories/', latest(storyDates.map((story) => story.date))] as [string, string | null]]
      : []),
    ...storyDates.map((story) => [story.page, story.date] as [string, string | null]),
    ...model.things.map((thing): [string, string | null] => [thing.page, thingDates.get(thing.id) ?? null]),
    ...topicDates.map((topic): [string, string | null] => [topic.page, topic.date])
  ];
  // Only a page with no dated source at all (uncommitted content in a local build) falls back to the build.
  return pages.map(([page, date]) => ({ loc: `${model.url}${page}`, lastmod: w3c(date ?? model.generated) }));
}

export function sitemapXml(entries: SitemapEntry[]) {
  return `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((entry) => `  <url><loc>${entry.loc}</loc><lastmod>${entry.lastmod}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`;
}
