// The small charts, written as plain SVG with titles so they read without scripts.
import { escapeHtml } from './html';
import type { MonthCount } from './schema';
import type { Timeline, TimelineRow } from './site';

// A twelve-month sparkline of commits and publications. Evidence, never a verdict.
export function sparkline(months: MonthCount[], label: string, variant?: string) {
  const max = Math.max(1, ...months.map((m) => m.count));
  const width = 12 * 7;
  const height = 18;
  const bars = months
    .map(({ month, count }, i) => {
      const h = count ? Math.max(2, Math.round((count / max) * (height - 2))) : 1;
      return `<rect x="${i * 7}" y="${height - h}" width="5" height="${h}" rx="1.5" class="${count ? 'spark-on' : 'spark-off'}"><title>${month}: ${count}</title></rect>`;
    })
    .join('');
  return `<svg class="sparkline${variant ? ` sparkline-${variant}` : ''}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeHtml(label)}">${bars}</svg>`;
}

// The timeline reads down the page, newest year first. Each thing gets a small strip covering every
// year on the timeline: its span as a bar, its sourced events as dots. Both are plain SVG with titles.
export function lifespan(row: TimelineRow, timeline: Timeline) {
  const step = 4;
  const years = timeline.lastYear - timeline.firstYear + 1;
  const width = years * step;
  const height = 12;
  const x = (y: number) => (y - timeline.firstYear) * step;
  const thing = row.thing;
  const span =
    row.start === row.end
      ? `${row.start}`
      : `${row.start} to ${thing.status === 'active' || thing.status === 'dormant' ? 'now' : row.end}`;
  const dots = [...new Set(row.events.map((e) => e.year))]
    .map((ey) => `<circle cx="${x(ey) + step / 2}" cy="${height / 2}" r="1.6" class="ls-event"/>`)
    .join('');
  const label = `${thing.title}: ${span}, ${row.events.length} sourced ${row.events.length === 1 ? 'event' : 'events'}`;
  return `<svg class="lifespan" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeHtml(label)}"><title>${escapeHtml(label)}</title><rect x="0" y="${height / 2 - 1}" width="${width}" height="2" rx="1" class="ls-track"/><rect x="${x(row.start)}" y="2" width="${x(row.end) + step - x(row.start)}" height="${height - 4}" rx="3" class="ls-bar ls-${thing.status}"/>${dots}</svg>`;
}
