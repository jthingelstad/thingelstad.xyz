// Connection diagrams, drawn at build time with Pele (https://pele.run) from the same edges the list
// beside them shows. The page ships SVG only: no diagram code runs in the browser. Pages are static,
// so each diagram is rendered twice, wide and narrow, and the stylesheet shows the one that fits.
// A hub with many connections cannot fold to phone width, and shrinking it makes the labels
// unreadable, so phones get no diagram there: the list below carries the same edges.
import { render } from 'pele';
import type { SiteModel, SiteThing } from './site';

// Mermaid label text: quotes and # would otherwise be read as syntax.
// Widest narrow render shown on a phone: about 350px of column, so labels shrink by a sixth at most.
export const phoneWidth = 420;

const label = (value: string) => value.replace(/#/g, '#35;').replace(/"/g, '#quot;');

export function connectionSource(thing: SiteThing, model: SiteModel) {
  if (!thing.connections.length && !thing.inbound.length) return null;
  const byId = new Map(model.things.map((t) => [t.id, t]));
  byId.set(thing.id, thing);
  const ids = new Map<string, string>([[thing.id, 't0']]);
  const node = (id: string) => {
    if (!ids.has(id)) ids.set(id, `t${ids.size}`);
    return ids.get(id)!;
  };
  const edges = [
    ...thing.inbound.map((edge) => ({ from: node(edge.from), to: 't0', edge })),
    ...thing.connections.map((edge) => ({ from: 't0', to: node(edge.to), edge }))
  ];
  const lines = ['flowchart LR', `  accTitle: Connections of ${label(thing.title)}`];
  for (const [id, key] of ids) {
    const other = byId.get(id)!;
    lines.push(`  ${key}["${label(other.title)}"]:::${id === thing.id ? 'self' : other.status}`);
  }
  for (const { from, to, edge } of edges)
    lines.push(`  ${from} ${edge.kind === 'lineage' ? '-.->' : '-->'}|"${label(edge.label)}"| ${to}`);
  for (const [id, key] of ids) if (id !== thing.id) lines.push(`  click ${key} href "${byId.get(id)!.page}"`);
  return lines.join('\n');
}

export function connectionDiagram(thing: SiteThing, model: SiteModel) {
  const source = connectionSource(thing, model);
  if (!source) return null;
  const options = { fontFamily: 'Inter, sans-serif', padding: 4 };
  const narrow = render(source, { ...options, idPrefix: `${thing.id}-narrow`, maxWidth: 340 });
  return {
    wide: render(source, { ...options, idPrefix: `${thing.id}-wide`, autoDirection: false }).svg,
    narrow: narrow.width <= phoneWidth ? narrow.svg : null
  };
}
