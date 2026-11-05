// The Years pages: /years/ draws one row a year and /years/<year>/ opens it. A year page gathers what the old
// Timeline, History and Activity pages each held for that year: what started and ended, the sourced events, and
// the commits and publications behind them. Every number is printed, so the chart's rows are also its table.
import type { Activity } from './activity';
import type { HistoryEvent } from './schema';
import type { SiteThing, Timeline } from './site';

const yearPage = (year: number | string) => `/years/${year}/`;
// An event's address and a week's. A week belongs to the year it starts in.
export const eventPage = (event: { id: string; date: string }) => `${yearPage(event.date.slice(0, 4))}#${event.id}`;
export const weekPage = (week: string) => `${yearPage(week.slice(2, 6))}#${week}`;

export type YearPage = {
  year: number;
  page: string;
  total: number; // alive this year
  already: SiteThing[]; // alive this year, started earlier
  started: SiteThing[];
  ended: SiteThing[];
  events: HistoryEvent[];
  kinds: { kind: string; count: number }[];
  work: Activity['years'][number] | null;
  tiles: { count: number; label: string }[]; // the work, as numbers
  weeks: Activity['weeks'];
  older: number | null;
  newer: number | null;
  row: string; // "38 alive · 28 new · 66 events"
  line: string; // "38 alive · 28 new · 5 ended · 66 events"
  names: string; // "Cards, Changelog, Clash Royale API Agent Reference, and 25 more"
  share: number; // the row's bar, as a percentage of the busiest year
};

const namesShown = 3;
function nameList(things: SiteThing[]) {
  const titles = things.map((thing) => thing.title);
  if (titles.length <= namesShown) return titles.join(', ');
  return `${titles.slice(0, namesShown).join(', ')}, and ${titles.length - namesShown} more`;
}
function workTiles(work: Activity['years'][number] | null) {
  if (!work) return [];
  const unnamed = work.who.agent - work.who.claude - work.who.codex;
  return [
    { count: work.total, label: work.total === 1 ? 'commit' : 'commits' },
    { count: work.who.claude, label: 'with Claude' },
    { count: work.who.codex, label: 'with Codex' },
    { count: unnamed, label: work.who.claude || work.who.codex ? 'with another agent' : 'with an agent' },
    { count: work.who.me, label: 'by Jamie' },
    { count: work.who.others, label: 'by others' },
    { count: work.publications, label: work.publications === 1 ? 'publication' : 'publications' }
  ].filter((tile) => tile.count > 0);
}
const events = (count: number) => (count ? [`${count} ${count === 1 ? 'event' : 'events'}`] : []);

export function buildYearPages(timeline: Timeline, history: HistoryEvent[], activity: Activity): YearPage[] {
  const live = (thing: SiteThing) => thing.status === 'active' || thing.status === 'dormant';
  const byTitle = (a: SiteThing, b: SiteThing) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' });
  const counted = timeline.lastYear - timeline.firstYear + 1;
  const rows = Array.from({ length: counted }, (_, i) => timeline.lastYear - i).map((year) => ({
    year,
    alive: timeline.rows.filter((row) => row.start <= year && row.end >= year)
  }));
  const most = Math.max(1, ...rows.map((row) => row.alive.length));
  return rows.map(({ year, alive }) => {
    const started = alive.filter((row) => row.start === year).map((row) => row.thing);
    const already = alive.filter((row) => row.start < year).map((row) => row.thing);
    const ended = alive.filter((row) => row.end === year && !live(row.thing)).map((row) => row.thing);
    const these = history.filter((event) => event.date.startsWith(String(year)));
    const work = activity.years.find((item) => item.year === year) ?? null;
    const kinds = [...new Set(these.map((event) => event.kind))].map((kind) => ({
      kind,
      count: these.filter((event) => event.kind === kind).length
    }));
    const lead = [`${alive.length} alive`, ...(started.length ? [`${started.length} new`] : [])];
    return {
      year,
      page: yearPage(year),
      total: alive.length,
      already: already.toSorted(byTitle),
      started: started.toSorted(byTitle),
      ended: ended.toSorted(byTitle),
      events: these,
      kinds,
      work,
      tiles: workTiles(work),
      weeks: activity.weeks.filter((week) => week.id.slice(2, 6) === String(year)),
      older: year > timeline.firstYear ? year - 1 : null,
      newer: year < timeline.lastYear ? year + 1 : null,
      row: [...lead, ...events(these.length)].join(' · '),
      line: [...lead, ...(ended.length ? [`${ended.length} ended`] : []), ...events(these.length)].join(' · '),
      names: nameList(started.toSorted(byTitle)),
      share: Math.round((alive.length / most) * 1000) / 10
    };
  });
}
