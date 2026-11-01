// Activity: what landed in each thing, read from the commit and publication logs. Evidence like every other
// observation: it never sets a status, and the history ledger stays the place for decisions.
//
// A thing's commits are those of its own repositories (a `successor` repository is someone else carrying the
// thing on), scoped to the directory a source names. Its publications are the items of its own feeds, a
// newsletter and its audio edition counted once. Days and weeks are US Central, where I live; a week starts
// on Monday. Every count is of distinct commits, so a commit two things share is counted once in a total.
import {
  githubKey,
  websiteKey,
  type CommitAuthor,
  type CommitEntry,
  type CommitLogObservation,
  type MonthCount,
  type PublicationsObservation,
  type Status,
  type ThingSource
} from './schema';

const activityZone = 'America/Chicago';
const weeksShown = 12; // on /activity/, the week of the newest collection and the eleven before it
const daysInFeed = 30; // in activity.xml, the newest complete days with something in them
const headlinesShown = 3;
const publicationsShown = 3;
const recentOnThing = 4; // weeks with activity on a thing's page

const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: activityZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});
export const localDay = (instant: string) => dayFormat.format(new Date(instant));
const shiftDay = (day: string, days: number) => {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
export const weekOf = (day: string) => shiftDay(day, -((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7));

// Who made the commits. `claude` and `codex` count the agent commits that name one; the rest of `agent` are
// commits my agents made under their own names without saying which model ran them.
export type Who = Record<CommitAuthor, number> & { claude: number; codex: number };
const noOne = (): Who => ({ me: 0, agent: 0, others: 0, claude: 0, codex: 0 });
function tally(commits: CommitEntry[]): Who {
  const who = noOne();
  for (const commit of commits) {
    who[commit.by]++;
    if (commit.by === 'agent' && commit.agents?.includes('claude')) who.claude++;
    else if (commit.by === 'agent' && commit.agents?.includes('codex')) who.codex++;
  }
  return who;
}
const plural = (n: number, one: string, many = `${one}s`) =>
  `${new Intl.NumberFormat('en-US').format(n)} ${n === 1 ? one : many}`;
function whoText(who: Who) {
  const n = (value: number) => new Intl.NumberFormat('en-US').format(value);
  const unnamed = who.agent - who.claude - who.codex;
  return [
    who.claude ? `${n(who.claude)} with Claude` : '',
    who.codex ? `${n(who.codex)} with Codex` : '',
    unnamed ? `${n(unnamed)} with ${who.claude || who.codex ? 'another agent' : 'an agent'}` : '',
    who.me ? `${n(who.me)} by Jamie` : '',
    who.others ? `${n(who.others)} by others` : ''
  ]
    .filter(Boolean)
    .join(', ');
}

// "48 commits (46 with Claude, 2 by Jamie) and 2 publications", or "134 commits, all with Claude", for a
// thing, a week or a day.
export function activitySummary(entry: {
  commits?: number;
  total?: number; // a year's or a thing's commits
  who: Who;
  publications?: number;
  publicationCount?: number;
}) {
  const count = entry.commits ?? entry.total ?? 0;
  const published = entry.publicationCount ?? entry.publications ?? 0;
  const who = whoText(entry.who);
  const one = who && !who.includes(',') && who.startsWith(`${new Intl.NumberFormat('en-US').format(count)} `);
  const by = one ? who.slice(who.indexOf(' ') + 1) : '';
  const commits =
    count === 1 && one
      ? `1 commit ${by}`
      : one
        ? `${plural(count, 'commit')}, all ${by}`
        : `${plural(count, 'commit')}${who ? ` (${who})` : ''}`;
  // "44 commits, all by Jamie, and 65 publications": the comma keeps "all by Jamie" off the publications.
  return [count ? commits : '', published ? plural(published, 'publication') : '']
    .filter(Boolean)
    .join(one && count > 1 ? ', and ' : ' and ');
}

type CommitAtom = CommitEntry & { key: string; url: string; repository: string; day: string };
type PublicationAtom = { key: string; title: string; url: string | null; date: string; day: string };
type TagAtom = { key: string; name: string; url: string; date: string; day: string };
type Scope = { url: string; branch: string; path: string | null };
export type ActivityThing = { id: string; title: string; page: string; status: Status; sources: ThingSource[] };
type Atoms = {
  thing: ActivityThing;
  commits: CommitAtom[];
  tags: TagAtom[];
  publications: PublicationAtom[];
  scope: Scope | null; // the one repository scope a thing has, for "the rest on GitHub"
};

type Headline = { text: string; url: string; date: string };
type ThingPeriod = {
  id: string;
  title: string;
  page: string;
  status: Status;
  period: string; // the first day of the day or week
  commits: number;
  who: Who;
  whoText: string;
  headlines: Headline[]; // tags first, then pull request titles, then other subjects
  more: number; // commits not among the headlines
  moreUrl: string | null;
  published: Headline[];
  publicationCount: number;
  last: string; // the newest instant in the period
};
type ActivityWeek = {
  id: string;
  start: string;
  end: string;
  current: boolean; // the week of the newest collection, still going
  commits: number;
  who: Who;
  publications: number;
  things: ThingPeriod[];
};
export type ActivityDay = {
  day: string;
  week: string; // its week's anchor on /activity/
  last: string;
  commits: number;
  who: Who;
  publications: number;
  things: ThingPeriod[];
};
type ActivityYear = {
  year: number;
  total: number;
  who: Who;
  publications: number;
  things: { id: string; title: string; page: string; commits: number; publications: number }[];
};
export type ThingRecord = {
  total: number;
  who: Who;
  whoText: string;
  firstCommit: string | null; // local days
  firstPublication: string | null; // the oldest item the feed log holds, not necessarily the first ever
  publications: number;
  years: { year: number; total: number; who: Who }[]; // every year from the first to the last
  peak: { year: number; total: number } | null; // the year with the most commits, unless years tie
  recent: (ThingPeriod & { week: string | null })[]; // week: its anchor on /activity/, while it is shown there
};
export type Activity = {
  collected: string | null; // the newest commit or publication log
  zone: string;
  total: number;
  who: Who;
  publications: number;
  years: ActivityYear[]; // newest first
  mostInYear: number;
  weeks: ActivityWeek[]; // newest first
  days: ActivityDay[]; // newest first, complete days only
};

// The sources whose logs are a thing's activity: its own repositories and its own feeds.
const ownFeeds = new Set(['website', 'podcast']);
export const countsAsActivity = (source: ThingSource) =>
  source.kind === 'github' ? source.role !== 'successor' : Boolean(source.feed) && ownFeeds.has(source.role);
function atomsFor(
  thing: ActivityThing,
  logs: Map<string, CommitLogObservation>,
  publications: Map<string, PublicationsObservation>,
  until: string
): Atoms {
  const commits = new Map<string, CommitAtom>();
  const tags = new Map<string, TagAtom>();
  const scopes: Scope[] = [];
  for (const source of thing.sources) {
    if (source.kind !== 'github' || !countsAsActivity(source)) continue;
    const log = logs.get(githubKey(source.repository));
    if (!log) continue;
    scopes.push({ url: log.url, branch: log.branch, path: source.path ?? null });
    for (const commit of log.commits) {
      if (source.path && !commit.paths?.includes(source.path)) continue;
      if (commit.date > until) continue;
      const key = `${log.repository.toLowerCase()}@${commit.sha}`;
      commits.set(key, {
        ...commit,
        key,
        url: `${log.url}/commit/${commit.sha}`,
        repository: log.repository,
        day: localDay(commit.date)
      });
    }
    if (!source.path)
      for (const tag of log.tags) {
        if (tag.date > until) continue;
        const key = `${log.repository.toLowerCase()}#${tag.name}`;
        tags.set(key, {
          key,
          name: tag.name,
          url: `${log.url}/releases/tag/${tag.name}`,
          date: tag.date,
          day: localDay(tag.date)
        });
      }
  }
  const items = new Map<string, PublicationAtom>();
  for (const source of thing.sources) {
    if (source.kind !== 'website' || !source.feed || !countsAsActivity(source)) continue;
    const log = publications.get(websiteKey(source.url));
    if (!log) continue;
    for (const item of log.items) {
      if (item.date > until) continue;
      const key = item.url ?? item.id ?? `${item.date} ${item.title}`;
      if (items.has(key)) continue;
      items.set(key, {
        key,
        title: item.title ?? item.excerpt ?? 'A post',
        url: item.url,
        date: item.date,
        day: localDay(item.date)
      });
    }
  }
  const newest = <T extends { date: string }>(values: Iterable<T>) =>
    [...values].sort((a, b) => b.date.localeCompare(a.date));
  return {
    thing,
    commits: newest(commits.values()),
    tags: newest(tags.values()),
    publications: newest(items.values()),
    scope: scopes.length === 1 ? scopes[0] : null
  };
}

const noise = /^Merge (branch|remote-tracking branch|pull request)\b/;
function headlines(commits: CommitAtom[], tags: TagAtom[]): Headline[] {
  const chosen: Headline[] = tags
    .slice(0, headlinesShown)
    .map((tag) => ({ text: `Tagged ${tag.name}`, url: tag.url, date: tag.date }));
  const useful = commits.filter((c) => c.subject.length >= 4 && !noise.test(c.subject));
  const seen = new Set<string>();
  for (const commit of [...useful.filter((c) => c.pr), ...useful.filter((c) => !c.pr)]) {
    if (chosen.length >= headlinesShown) break;
    if (seen.has(commit.subject)) continue;
    seen.add(commit.subject);
    chosen.push({ text: commit.subject, url: commit.url, date: commit.date });
  }
  return chosen.sort((a, b) => b.date.localeCompare(a.date));
}
function period(atoms: Atoms, start: string, end: string): ThingPeriod | null {
  const within = (day: string) => day >= start && day <= end;
  const commits = atoms.commits.filter((c) => within(c.day));
  const tags = atoms.tags.filter((t) => within(t.day));
  const items = atoms.publications.filter((p) => within(p.day));
  if (!commits.length && !tags.length && !items.length) return null;
  const who = tally(commits);
  const lines = headlines(commits, tags);
  const shownCommits = lines.filter((line) => commits.some((c) => c.url === line.url)).length;
  const scope = atoms.scope;
  return {
    id: atoms.thing.id,
    title: atoms.thing.title,
    page: atoms.thing.page,
    status: atoms.thing.status,
    period: start,
    commits: commits.length,
    who,
    whoText: whoText(who),
    headlines: lines,
    more: commits.length - shownCommits,
    moreUrl:
      scope && commits.length > shownCommits
        ? `${scope.url}/commits/${scope.branch}${scope.path ? `/${scope.path}` : ''}?since=${start}&until=${end}`
        : null,
    published: items
      .slice(0, publicationsShown)
      .map((item) => ({ text: item.title, url: item.url ?? atoms.thing.page, date: item.date })),
    publicationCount: items.length,
    last: [commits[0]?.date, tags[0]?.date, items[0]?.date].filter(Boolean).toSorted().at(-1)!
  };
}
// Distinct commits and publications across the things in a period.
function totals(all: Atoms[], within: (day: string) => boolean) {
  const commits = new Map<string, CommitAtom>();
  const items = new Set<string>();
  for (const atoms of all) {
    for (const commit of atoms.commits) if (within(commit.day)) commits.set(commit.key, commit);
    for (const item of atoms.publications) if (within(item.day)) items.add(`${atoms.thing.id} ${item.key}`);
  }
  return { commits: commits.size, who: tally([...commits.values()]), publications: items.size };
}
const bySize = (a: ThingPeriod, b: ThingPeriod) =>
  b.commits + b.publicationCount - (a.commits + a.publicationCount) || a.title.localeCompare(b.title);

// The busiest year, when one year is busier than every other.
function peakOf(years: { year: number; total: number }[]) {
  const sorted = years.toSorted((a, b) => b.total - a.total);
  return sorted[0] && sorted[0].total > (sorted[1]?.total ?? 0)
    ? { year: sorted[0].year, total: sorted[0].total }
    : null;
}

export function buildActivity(
  things: ActivityThing[],
  logs: CommitLogObservation[],
  publicationLogs: PublicationsObservation[]
): { activity: Activity; things: Map<string, ThingRecord> } {
  const observed = [...logs, ...publicationLogs].map((o) => o.observedAt).toSorted();
  const collected = observed.at(-1) ?? null;
  // A clock that runs ahead puts a commit in the future; it waits for the collection to catch up with it.
  const until = collected ?? new Date(0).toISOString();
  const byRepository = new Map(logs.map((log) => [githubKey(log.repository), log]));
  const bySite = new Map(publicationLogs.map((log) => [websiteKey(log.url), log]));
  const all = things.map((thing) => atomsFor(thing, byRepository, bySite, until));
  const active = all.filter((a) => a.commits.length || a.tags.length || a.publications.length);

  const today = collected ? localDay(collected) : null;
  const weeks: ActivityWeek[] = [];
  if (today)
    for (let i = 0; i < weeksShown; i++) {
      const start = shiftDay(weekOf(today), -7 * i);
      const end = shiftDay(start, 6);
      const within = (day: string) => day >= start && day <= end;
      weeks.push({
        id: `w-${start}`,
        start,
        end,
        current: i === 0,
        ...totals(active, within),
        things: active.flatMap((atoms) => period(atoms, start, end) ?? []).sort(bySize)
      });
    }
  // A day is in the feed once it is over: the collection that saw it ran on a later day.
  const days = [...new Set(active.flatMap((a) => [...a.commits, ...a.tags, ...a.publications].map((x) => x.day)))]
    .filter((day) => today !== null && day < today)
    .toSorted()
    .reverse()
    .slice(0, daysInFeed)
    .map((day): ActivityDay => {
      const entries = active.flatMap((atoms) => period(atoms, day, day) ?? []).sort(bySize);
      return {
        day,
        week: `w-${weekOf(day)}`,
        last: entries
          .map((e) => e.last)
          .toSorted()
          .at(-1)!,
        ...totals(active, (d) => d === day),
        things: entries
      };
    });

  const yearOf = (day: string) => Number(day.slice(0, 4));
  const yearsSeen = active.flatMap((a) => [...a.commits, ...a.publications].map((x) => yearOf(x.day)));
  const firstYear = yearsSeen.length ? Math.min(...yearsSeen) : null;
  const lastYear = today ? yearOf(today) : null;
  const years: ActivityYear[] = [];
  if (firstYear !== null && lastYear !== null)
    for (let year = lastYear; year >= firstYear; year--) {
      const within = (day: string) => yearOf(day) === year;
      const sum = totals(active, within);
      years.push({
        year,
        total: sum.commits,
        who: sum.who,
        publications: sum.publications,
        things: active
          .map((a) => ({
            id: a.thing.id,
            title: a.thing.title,
            page: a.thing.page,
            commits: a.commits.filter((c) => within(c.day)).length,
            publications: a.publications.filter((p) => within(p.day)).length
          }))
          .filter((t) => t.commits || t.publications)
          .sort((a, b) => b.commits + b.publications - (a.commits + a.publications) || a.title.localeCompare(b.title))
      });
    }
  const overall = totals(active, () => true);

  const shownWeeks = new Set(weeks.map((week) => week.start));
  const records = new Map<string, ThingRecord>();
  for (const atoms of active) {
    const who = tally(atoms.commits);
    const commitYears = atoms.commits.map((c) => yearOf(c.day));
    const span: ThingRecord['years'] = [];
    if (commitYears.length) {
      const last =
        atoms.thing.status === 'active' || atoms.thing.status === 'dormant'
          ? Math.max(lastYear ?? 0, ...commitYears)
          : Math.max(...commitYears);
      for (let year = Math.min(...commitYears); year <= last; year++) {
        const these = atoms.commits.filter((c) => yearOf(c.day) === year);
        span.push({ year, total: these.length, who: tally(these) });
      }
    }
    const weeksWith = [...new Set([...atoms.commits, ...atoms.tags, ...atoms.publications].map((x) => weekOf(x.day)))]
      .toSorted()
      .reverse()
      .slice(0, recentOnThing);
    records.set(atoms.thing.id, {
      total: atoms.commits.length,
      who,
      whoText: whoText(who),
      firstCommit: atoms.commits.at(-1)?.day ?? null,
      firstPublication: atoms.publications.at(-1)?.day ?? null,
      publications: atoms.publications.length,
      years: span,
      peak: peakOf(span),
      recent: weeksWith.flatMap((start) => {
        const entry = period(atoms, start, shiftDay(start, 6));
        return entry ? [{ ...entry, week: shownWeeks.has(start) ? `w-${start}` : null }] : [];
      })
    });
  }
  return {
    activity: {
      collected,
      zone: activityZone,
      total: overall.commits,
      who: overall.who,
      publications: overall.publications,
      years,
      mostInYear: Math.max(1, ...years.map((y) => y.total)),
      weeks,
      days
    },
    things: records
  };
}

// Commits and publications per calendar month (UTC, like the rest of the sparkline), for a thing's
// twelve-month sparkline. Only the logs a thing has; the caller adds what other observations say.
export function activityMonths(
  thing: ActivityThing,
  logs: CommitLogObservation[],
  publicationLogs: PublicationsObservation[]
) {
  const atoms = atomsFor(
    thing,
    new Map(logs.map((log) => [githubKey(log.repository), log])),
    new Map(publicationLogs.map((log) => [websiteKey(log.url), log])),
    '9999'
  );
  const months = new Map<string, number>();
  for (const item of [...atoms.commits, ...atoms.publications])
    months.set(item.date.slice(0, 7), (months.get(item.date.slice(0, 7)) ?? 0) + 1);
  return [...months].map(([month, count]): MonthCount => ({ month, count }));
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const order: CommitAuthor[] = ['me', 'agent', 'others'];
const label: Record<CommitAuthor, string> = { me: 'by Jamie', agent: 'with an agent', others: 'by others' };
// A bar whose far end is rounded and whose baseline end is square.
const rightRounded = (x: number, y: number, w: number, h: number) => {
  const r = Math.min(4, w, h / 2);
  return `M${x.toFixed(1)} ${y}h${(w - r).toFixed(1)}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${(-(w - r)).toFixed(1)}z`;
};
const topRounded = (x: number, y: number, w: number, h: number) => {
  const r = Math.min(4, w / 2, h);
  return `M${x} ${(y + h).toFixed(1)}v${(-(h - r)).toFixed(1)}a${r} ${r} 0 0 1 ${r} ${-r}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${(h - r).toFixed(1)}z`;
};
// One year's commits as a bar split by who made them, scaled to the busiest year. A 2px gap in the paper
// colour separates the parts; only the far end is rounded.
export function whoBar(who: Who, most: number, caption: string) {
  const width = 360;
  const height = 12;
  const parts = order.filter((by) => who[by] > 0);
  const total = parts.reduce((sum, by) => sum + who[by], 0);
  const length = (total / Math.max(1, most)) * width;
  const gaps = Math.max(0, parts.length - 1) * 2;
  let x = 0;
  const marks = parts
    .map((by, i) => {
      const w = Math.max(1.5, (who[by] / total) * Math.max(parts.length * 1.5, length - gaps));
      const last = i === parts.length - 1;
      const shape = last
        ? `<path d="${rightRounded(x, 0, w, height)}"`
        : `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${height}"`;
      const mark = `${shape} class="who-${by}"><title>${new Intl.NumberFormat('en-US').format(who[by])} ${label[by]}</title>${last ? '</path>' : '</rect>'}`;
      x += w + 2;
      return mark;
    })
    .join('');
  return `<svg class="who-bar" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escape(caption)}">${marks}</svg>`;
}
// A thing's commits per year as columns split by who made them, me at the baseline. Two years or more:
// one year is a number, not a chart.
export function yearColumns(record: ThingRecord, title: string) {
  if (record.years.length < 2) return '';
  const column = 12;
  const gap = 4;
  const height = 48;
  const most = Math.max(1, ...record.years.map((y) => y.total));
  const width = record.years.length * (column + gap) - gap;
  const marks = record.years
    .map(({ year, total, who }, i) => {
      const x = i * (column + gap);
      if (!total)
        return `<rect x="${x}" y="${height - 1}" width="${column}" height="1" class="who-none"><title>${year}: no commits</title></rect>`;
      const full = Math.max(2, (total / most) * height);
      const text = (by: CommitAuthor) => `${new Intl.NumberFormat('en-US').format(who[by])} ${label[by]}`;
      // A column too short to split honestly is drawn whole, in the colour of whoever made most of it.
      const parts = order.filter((by) => who[by] > 0);
      if (full - (parts.length - 1) * 2 < parts.length * 3) {
        const major = parts.reduce((a, b) => (who[b] > who[a] ? b : a));
        return `<path d="${topRounded(x, height - full, column, full)}" class="who-${major}"><title>${year}: ${parts.map(text).join(', ')}</title></path>`;
      }
      const gaps = (parts.length - 1) * 2;
      let y = height;
      return parts
        .map((by, j) => {
          const h = Math.max(1, (who[by] / total) * (full - gaps));
          y -= h;
          const top = j === parts.length - 1;
          const mark = top
            ? `<path d="${topRounded(x, y, column, h)}" class="who-${by}"><title>${year}: ${text(by)}</title></path>`
            : `<rect x="${x}" y="${y.toFixed(1)}" width="${column}" height="${h.toFixed(1)}" class="who-${by}"><title>${year}: ${text(by)}</title></rect>`;
          y -= 2;
          return mark;
        })
        .join('');
    })
    .join('');
  const first = record.years[0].year;
  const last = record.years.at(-1)!.year;
  const caption = `${title}: commits per year from ${first} to ${last}, ${plural(record.total, 'commit')} in all`;
  return `<svg class="year-columns" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escape(caption)}">${marks}</svg>`;
}
