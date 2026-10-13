import { catalog } from './projects';

export type Connection = { from: string; to: string; label: string; detail: string; source: string };

export const connections: Connection[] = [
  {
    from: 'wt-builder',
    to: 'weekly-thing',
    label: 'publishes',
    detail: 'WT Builder authors issues and sends the website, email, and audio editions of Weekly Thing.',
    source: 'https://weekly.thingelstad.com/'
  },
  {
    from: 'wt-builder',
    to: 'another-thing',
    label: 'authors',
    detail: 'Another Thing podcast authoring moved into WT Builder in October 2026.',
    source: 'https://another.thingelstad.com/'
  },
  {
    from: 'weekly-thing',
    to: 'librarian',
    label: 'is indexed by',
    detail: 'Librarian builds a searchable corpus from Weekly Thing content.',
    source: 'https://thingy.thingelstad.com/about/'
  },
  {
    from: 'another-thing',
    to: 'librarian',
    label: 'transcripts are indexed by',
    detail: 'Another Thing transcripts are imported into Librarian’s podcast corpus.',
    source: 'https://thingy.thingelstad.com/about/'
  },
  {
    from: 'jamie-thingelstad-blog',
    to: 'librarian',
    label: 'is indexed by',
    detail:
      'The blog contributes writing to the archive that Librarian retrieves from. Micro.blog remains the blog’s source of authority.',
    source: 'https://thingy.thingelstad.com/about/'
  },
  {
    from: 'librarian',
    to: 'thingy',
    label: 'powers',
    detail: 'Thingy is the web query surface for the Librarian archive and retrieval API.',
    source: 'https://thingy.thingelstad.com/connect/'
  },
  {
    from: 'thing-hugo',
    to: 'jamie-thingelstad-blog',
    label: 'is its theme',
    detail: 'Thing Hugo is the public Hugo theme developed for the blog’s Micro.blog publishing environment.',
    source: 'https://github.com/jthingelstad/thing-hugo'
  },
  {
    from: 'mb',
    to: 'jamie-thingelstad-blog',
    label: 'works with its platform',
    detail: 'mb is a CLI and MCP interface for Micro.blog, the platform on which Jamie publishes his blog.',
    source: 'https://github.com/jthingelstad/mb'
  },
  {
    from: 'mb-audit',
    to: 'jamie-thingelstad-blog',
    label: 'audits its platform',
    detail:
      'mb-audit compares a Micro.blog site with its BAR backups to check that the published content remains intact.',
    source: 'https://github.com/jthingelstad/mb-audit'
  },
  {
    from: 'homebrew-mb-tap',
    to: 'mb',
    label: 'distributes',
    detail: 'The Homebrew tap provides an installation and distribution path for mb.',
    source: 'https://github.com/jthingelstad/homebrew-mb'
  },
  {
    from: 'elixir-mcp-collector',
    to: 'elixir',
    label: 'gathers observations for',
    detail:
      'Collectors lease work from Elixir, fetch public observations from the Clash Royale API, and submit the results.',
    source: 'https://elixir.poapkings.com/docs/operators'
  },
  {
    from: 'elixir',
    to: 'elixir-mcp-discord',
    label: 'provides recorded facts to',
    detail: 'The configurable Discord agent gets its game facts through Elixir MCP tools.',
    source: 'https://github.com/jthingelstad/elixir-mcp-discord'
  },
  {
    from: 'elixir',
    to: 'elixir-clan',
    label: 'includes',
    detail:
      'Clan management is a feature of the same Elixir platform and shares its recorded history, application, and runtime.',
    source: 'https://elixir.poapkings.com/docs'
  },
  {
    from: 'elixir',
    to: 'elixir-ladder',
    label: 'includes',
    detail: 'Elixir Ladder is the platform’s browser feature for exploring ladder history.',
    source: 'https://elixir.poapkings.com/docs'
  },
  {
    from: 'elixir',
    to: 'poap-kings',
    label: 'supplies clan data to',
    detail: 'The POAP KINGS website reads clan and roster data from Elixir’s JSON API.',
    source: 'https://poapkings.com/elixir/'
  },
  {
    from: 'poap-kings',
    to: 'elixir-drop',
    label: 'runs',
    detail: 'POAP KINGS runs Elixir Drop, its card-recognition and elixir-cost training game.',
    source: 'https://poapkings.com/elixir-drop/'
  },
  {
    from: 'elixir-bot',
    to: 'elixir',
    label: 'gave rise to',
    detail:
      'The original Elixir Bot was retired in September 2026. Recorded game history became the broader Elixir platform.',
    source: 'https://github.com/jthingelstad/elixir-bot'
  },
  {
    from: 'elixir-bot',
    to: 'elixir-mcp-discord',
    label: 'was succeeded by',
    detail: 'The configurable Elixir MCP Discord agent took over the original bot’s Discord role.',
    source: 'https://github.com/jthingelstad/elixir-bot'
  },
  {
    from: 'your-version-number',
    to: 'release-notes',
    label: 'grew into',
    detail: 'Release Notes uses Your Version Number’s birthday arithmetic in a daily email and personal journal.',
    source: 'https://github.com/jthingelstad/yvn-release-notes'
  },
  {
    from: 'r-w-book-club',
    to: 'oliver',
    label: 'includes',
    detail:
      'Oliver is the book club’s Discord agent and member application, sharing the same club database and corpus.',
    source: 'https://rwbookclub.com/'
  }
];

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
