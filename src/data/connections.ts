import { catalog, collection } from './projects';
import type { Connection } from './schema';

export const connections: Connection[] = collection.connections;

export function neighbors(id: string): string[] {
  return [
    ...new Set(connections.flatMap((edge) => (edge.from === id ? [edge.to] : edge.to === id ? [edge.from] : [])))
  ];
}

const connectedPositions: Record<string, [number, number]> = {
  'weekly-thing': [265, 170],
  'wt-builder': [120, 85],
  'another-thing': [150, 300],
  librarian: [380, 305],
  thingy: [525, 235],
  'jamie-thingelstad-blog': [345, 470],
  'thing-hugo': [180, 515],
  mb: [100, 395],
  'mb-audit': [495, 505],
  'homebrew-mb-tap': [95, 260],
  elixir: [830, 220],
  'elixir-mcp-collector': [690, 85],
  'elixir-mcp-discord': [1040, 120],
  'elixir-clan': [690, 350],
  'elixir-ladder': [950, 350],
  'poap-kings': [815, 455],
  'elixir-drop': [1035, 500],
  'elixir-bot': [1135, 270],
  'your-version-number': [635, 555],
  'release-notes': [535, 660],
  'r-w-book-club': [930, 650],
  oliver: [1100, 650]
};

const otherProjects = catalog.filter((project) => !connectedPositions[project.id]);
export const graphPositions: Record<string, [number, number]> = {
  ...connectedPositions,
  ...Object.fromEntries(
    otherProjects.map((project, index) => [
      project.id,
      [110 + (index % 5) * 245, 820 + Math.floor(index / 5) * 120] as [number, number]
    ])
  )
};
export const graphHeight = 920 + Math.max(0, Math.ceil(otherProjects.length / 5) - 1) * 120;
