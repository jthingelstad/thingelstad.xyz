import catalogData from './catalog.json';

export type Project = {
  id: string;
  title: string;
  summary: string;
  collection: string;
  color: string;
  introduction: string;
  idea: string;
  engineering: string[];
  stack: string[];
  url: string;
  source?: string;
  sourceLabel?: string;
  related: string[];
  questions: string[];
  started?: string;
};

export const projects: Project[] = [
  {
    id: 'elixir',
    title: 'Elixir',
    summary: 'Clash Royale history, recorded.',
    collection: 'AI & agents',
    color: '#8860d9',
    introduction: 'The game remembers the present. Elixir remembers what happened.',
    idea: 'The Clash Royale API offers a current snapshot and a short, rotating battle log. Elixir continuously records observations so players, clans, and their agents can ask questions about the history.',
    engineering: [
      'Independent collectors fetch public game observations from machines with allowlisted IP addresses.',
      'One recorded history serves the browser application, a remote MCP server, and a versioned JSON API.',
      'Clan management and Ladder are features of the same platform, sharing its record and application shell.'
    ],
    stack: ['React', 'TypeScript', 'PostgreSQL', 'AWS', 'MCP'],
    url: 'https://elixir.poapkings.com/',
    source: 'https://elixir.poapkings.com/docs',
    sourceLabel: 'Documentation',
    related: ['elixir-drop', 'elixir-mcp-discord', 'elixir-mcp-collector', 'poap-kings'],
    questions: ['How does Elixir keep the history?', 'What grew out of Elixir Bot?']
  },
  {
    id: 'your-version-number',
    title: 'Your Version Number',
    summary: 'Life, versioned.',
    collection: 'Play',
    color: '#1763ff',
    introduction: 'A different way to count the days.',
    idea: 'Write a birthday the way you would version a piece of software: decades, years into the decade, and days since the last birthday. The same idea has a Work Edition for career milestones.',
    engineering: [
      'A framework-free static site calculates its numbers in the browser.',
      'Dates, people, themes, and signed cards travel in the URL, making a view shareable without an account.',
      'The related Release Notes product adds daily email and a personal journal. It has its own server and storage.'
    ],
    stack: ['JavaScript', 'CSS', 'Static web', 'URL state'],
    url: 'https://yourversionnumber.com/',
    source: 'https://github.com/jthingelstad/yourversionnumber.com',
    related: ['release-notes', 'mb'],
    started: 'The idea began in 2018',
    questions: ['How does the version number work?', 'How is Release Notes related?']
  },
  {
    id: 'mb',
    title: 'mb',
    summary: 'Micro.blog from the command line.',
    collection: 'Developer tools',
    color: '#24272d',
    introduction: 'An open-web tool built for people, scripts, and agents.',
    idea: 'Give Micro.blog a compact, pipeable command-line interface that works without interactive prompts. The same services can be exposed to an AI client through a local MCP server.',
    engineering: [
      'The CLI and MCP tools share the same service layer.',
      'Write operations return durable receipts so an uncertain result can be checked before a request is sent again.',
      'An optional MCP server exposes 23 typed tools. Homebrew provides a distribution path.'
    ],
    stack: ['Python', 'CLI', 'MCP', 'Micro.blog'],
    url: 'https://github.com/jthingelstad/mb',
    source: 'https://github.com/jthingelstad/mb',
    related: ['mb-audit', 'homebrew-mb-tap', 'weekly-thing'],
    questions: ['How does mb work with AI agents?', 'What is interesting about its write receipts?']
  },
  {
    id: 'weekly-thing',
    title: 'Weekly Thing',
    summary: 'A weekly collection of links and ideas.',
    collection: 'Writing',
    color: '#eaa18f',
    introduction: 'Curiosity, collected and shared.',
    idea: 'A weekly collection of interesting links, ideas, and observations from across the internet. Its publishing tools grew alongside the newsletter, from a Shortcuts workflow into a dedicated authoring application.',
    engineering: [
      'WT Builder keeps an issue structured until it is sent, then renders different editions for the website, email, and audio.',
      'The public archive is an Eleventy site. Librarian builds the searchable archive that Thingy answers from.',
      'Authoring, public publishing, and archive retrieval have explicit ownership boundaries.'
    ],
    stack: ['Eleventy', 'Publishing', 'Email', 'Audio'],
    url: 'https://weekly.thingelstad.com/',
    source: 'https://weekly.thingelstad.com/',
    sourceLabel: 'Read the archive',
    related: ['wt-builder', 'librarian', 'thingy', 'another-thing'],
    started: 'Published since 2017',
    questions: ['What is behind the publishing workflow?', 'How do Weekly Thing and Thingy connect?']
  },
  {
    id: 'things-4-good',
    title: 'Things 4 Good',
    summary: 'Handmade candles. Family fundraising.',
    collection: 'Community',
    color: '#dda73f',
    introduction: 'Build something small. Do some good.',
    idea: 'The Thingelstad family’s annual handmade-candle fundraiser supports nonprofits chosen by the family. Its website brings together the sale, Maker Night, the organizations supported, and the impact over time.',
    engineering: [
      'One event dataset records each sale and its allocations to supported organizations.',
      'Totals, charts, and other impact figures are calculated from that shared dataset.',
      'An Eleventy build delivers a static site, with small interactive enhancements for exploration.'
    ],
    stack: ['Eleventy', 'JavaScript', 'Data-driven content'],
    url: 'https://things4good.xyz/',
    related: ['wicky-thing-candles', 'things-4-good-fall-fundraiser'],
    questions: ['How is the fundraiser’s impact calculated?', 'Show me other community projects.']
  },
  {
    id: 'road-sign-math',
    title: 'Road Sign Math',
    summary: 'Find an equation hiding in plain sight.',
    collection: 'Play',
    color: '#287454',
    introduction: 'A little mathematics. A lot of looking around.',
    idea: 'A driving game with a simple invitation: find a road sign whose numbers make a valid equation, photograph it, and share the discovery. The historical project now has a locally recovered archive of signs and images.',
    engineering: [
      'Historical wiki content is recovered into structured Markdown, with numbers, equations, places, and photo provenance.',
      'The recovered collection includes 251 signs, alongside the original rules and other project pages.',
      'Recovered images distinguish camera originals, archived originals, poster crops, and missing photos.'
    ],
    stack: ['Python', 'Markdown', 'Archives', 'Mathematics'],
    url: 'https://www.thingelstad.com/projects/road-sign-math/',
    related: ['planet-kubb-score', 'planet-kubb', 'open-loop'],
    started: 'A project from 2005–2014',
    questions: ['How was Road Sign Math recovered?', 'Show me other earlier experiments.']
  }
];

export type CatalogEntry = {
  id: string;
  title: string;
  summary: string;
  collection: string;
  url: string | null;
  historical: boolean;
};

const catalogOverrides: Record<string, string> = { elixir: 'elixir', 'your-version-number': 'your-version-number' };
export const catalog: CatalogEntry[] = catalogData.map((entry) => {
  const featured = projects.find((p) => p.id === (catalogOverrides[entry.id] ?? entry.id));
  return featured ? { ...entry, title: featured.title, summary: featured.summary, url: featured.url } : entry;
});

export const projectById = new Map(projects.map((project) => [project.id, project]));
export const entryById = new Map(catalog.map((entry) => [entry.id, entry]));

export function searchProjects(query: string): CatalogEntry[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return catalog;
  return catalog.filter((entry) => {
    const featured = projectById.get(entry.id);
    const text = [entry.title, entry.summary, entry.collection, ...(featured?.stack ?? [])]
      .join(' ')
      .toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
