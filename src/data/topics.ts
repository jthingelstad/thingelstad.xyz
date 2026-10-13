export type Topic = { id: string; title: string; description: string; projectIds: string[] };

// Topics overlap. Membership expresses a shared interest, not a project dependency.
export const topics: Topic[] = [
  {
    id: 'agents',
    title: 'Agents',
    description: 'Software that observes, remembers, and acts. A thread from personal tools to community companions.',
    projectIds: [
      'elixir',
      'elixir-bot',
      'elixir-mcp-discord',
      'elixir-mcp-collector',
      'oliver',
      'otto',
      'mb',
      'librarian',
      'thingy',
      'clash-royale-api-agent-reference',
      'projects-systems-administration'
    ]
  },
  {
    id: 'mediawiki',
    title: 'MediaWiki',
    description: 'Wikis as a place to build: communities, extensions, skins, and structured knowledge.',
    projectIds: [
      'wikiapiary',
      'wikinosh',
      'foreground',
      'filament',
      'parseurl',
      'numbers2words',
      'planet-kubb',
      'road-sign-math',
      'wikiwonders'
    ]
  },
  {
    id: 'semantic-mediawiki',
    title: 'Semantic MediaWiki',
    description: 'A wiki can be a database, too. Structured properties make knowledge queryable.',
    projectIds: ['wikiapiary', 'wikinosh']
  },
  {
    id: 'poap',
    title: 'POAP',
    description: 'Proof of participation, collected memories, and tools that connect tokens to the open web.',
    projectIds: ['poap2rss', '612-poap-challenge', 'poap-kings']
  },
  {
    id: 'crypto',
    title: 'Crypto',
    description: 'Experiments with onchain participation and digital collectibles, through the POAP ecosystem.',
    projectIds: ['poap2rss', '612-poap-challenge', 'poap-kings']
  },
  {
    id: 'mcp',
    title: 'MCP',
    description: 'Giving agents a useful interface to recorded knowledge and everyday tools.',
    projectIds: ['elixir', 'elixir-mcp-discord', 'elixir-mcp-collector', 'librarian', 'mb']
  },
  {
    id: 'open-web',
    title: 'The open web',
    description: 'Publishing, feeds, archives, and tools that keep information portable.',
    projectIds: [
      'jamie-thingelstad-blog',
      'weekly-thing',
      'another-thing',
      'wt-builder',
      'another-thing-builder',
      'thing-hugo',
      'librarian',
      'thingy',
      'mb',
      'mb-audit',
      'homebrew-mb-tap',
      'poap2rss',
      'open-loop',
      'link-blog',
      'smaller-than-a-redwood'
    ]
  },
  {
    id: 'play',
    title: 'Play',
    description: 'Games, playful arithmetic, and the communities that form around them.',
    projectIds: [
      'elixir',
      'elixir-bot',
      'elixir-clan',
      'elixir-ladder',
      'elixir-drop',
      'poap-kings',
      'planet-kubb',
      'planet-kubb-score',
      'road-sign-math',
      'your-version-number',
      'release-notes',
      'escaping-things',
      'clash-royale-api-agent-reference'
    ]
  }
];
export const topicById = new Map(topics.map((topic) => [topic.id, topic]));
export function topicsFor(id: string) {
  return topics.filter((topic) => topic.projectIds.includes(id));
}
