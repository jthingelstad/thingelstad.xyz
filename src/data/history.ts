import historyData from './history.json';
import { catalog } from './projects';
import { topicById } from './topics';

export type HistoryEvent = {
  id: string;
  projectIds: string[];
  /** YYYY, YYYY-MM, or YYYY-MM-DD. Never add precision that the source does not establish. */
  date: string;
  kind: 'launch' | 'milestone' | 'retirement' | 'archive' | 'development';
  title: string;
  summary: string;
  source: string;
};
export const historyEvents = historyData as HistoryEvent[];
export const historyYears = [...new Set(historyEvents.map((event) => Number(event.date.slice(0, 4))))].sort(
  (a, b) => b - a
);
export const eventKindLabels: Record<HistoryEvent['kind'], string> = {
  launch: 'Launch',
  milestone: 'Milestone',
  retirement: 'Retirement',
  archive: 'Archive record',
  development: 'Recorded development'
};
export function formatEventDate(date: string) {
  if (date.length === 4) return date;
  const value = new Date(`${date.length === 7 ? `${date}-01` : date}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    ...(date.length === 10 ? { day: 'numeric' } : {})
  }).format(value);
}
export function eventsForProject(id: string) {
  return historyEvents
    .filter((event) => event.projectIds.includes(id))
    .toSorted((a, b) => b.date.localeCompare(a.date));
}
export function eventsForTopic(topic: string | null) {
  const members = topic ? topicById.get(topic)?.projectIds : null;
  return members ? historyEvents.filter((event) => event.projectIds.some((id) => members.includes(id))) : historyEvents;
}

type TimelineBand = { year: number | null; y: number; height: number; projectIds: string[]; eventIds: string[] };
// A project's position represents its latest documented event, not its birthday.
// Older living projects can appear in the present while their full history remains in the inspector.
const groups = new Map<number | null, string[]>();
for (const entry of catalog) {
  const latest = eventsForProject(entry.id)[0];
  const year = latest ? Number(latest.date.slice(0, 4)) : null;
  groups.set(year, [...(groups.get(year) ?? []), entry.id]);
}
function makeTimelineLayout(columns: number, width: number) {
  const positions: Record<string, [number, number]> = {};
  const bands: TimelineBand[] = [];
  const echoesAt: Record<string, [number, number]> = {};
  let offset = 0;
  for (const year of [...new Set([...historyYears, ...groups.keys()])].sort((a, b) => (b ?? -1) - (a ?? -1))) {
    const projectIds = (groups.get(year) ?? []).toSorted((a, b) => {
      const dateOrder = (eventsForProject(b)[0]?.date ?? '').localeCompare(eventsForProject(a)[0]?.date ?? '');
      return dateOrder || a.localeCompare(b);
    });
    const echoes = historyEvents.filter(
      (event) =>
        Number(event.date.slice(0, 4)) === year &&
        event.projectIds.some((id) => Number(eventsForProject(id)[0]?.date.slice(0, 4)) > (year ?? 0))
    );
    const height = 125 + Math.ceil((projectIds.length + echoes.length) / columns) * 125;
    bands.push({ year, y: offset, height, projectIds, eventIds: echoes.map((event) => event.id) });
    const coordinate = (index: number): [number, number] => [
      columns === 1 ? width / 2 : 225 + (index % columns) * 270,
      offset + 110 + Math.floor(index / columns) * 125
    ];
    projectIds.forEach((id, index) => {
      positions[id] = coordinate(index);
    });
    echoes.forEach((event, index) => {
      echoesAt[event.id] = coordinate(projectIds.length + index);
    });
    offset += height;
  }
  return { positions, bands, eventPositions: echoesAt, height: offset, width };
}
export const timelineLayout = makeTimelineLayout(4, 1200);
export const compactTimelineLayout = makeTimelineLayout(1, 400);
