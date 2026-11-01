---
title: Elixir Bot
summary: 'POAP KINGS’ first clan agent, a Discord bot that watched the clan and talked with its members from February to September 2026, and the start of Elixir.'
collection: Games and communities
status: retired
url: https://github.com/jthingelstad/elixir-bot
started: '2026-02'
ended: '2026-09-26'
topics:
  - agents
  - play
sources:
  - kind: github
    repository: jthingelstad/elixir-bot
    role: implementation
connections:
  - kind: lineage
    to: elixir
    label: gave rise to
    detail: The original Elixir Bot was retired in September 2026. Recorded game history became the broader Elixir platform.
    source: https://github.com/jthingelstad/elixir-bot
  - kind: lineage
    to: elixir-mcp-discord
    label: was succeeded by
    detail: The configurable Elixir Discord agent took over the original bot’s Discord role.
    source: https://github.com/jthingelstad/elixir-bot
  - kind: lineage
    to: elixir-mcp-collector
    label: gave rise to
    detail: The original bot’s game observation work grew into a separate Collector that feeds Elixir’s recorded history.
    source: https://github.com/jthingelstad/elixir-bot
  - kind: lineage
    to: elixir-clan
    label: gave rise to
    detail: The original bot’s clan management work carried forward into Elixir Clan, now a feature of the shared Elixir platform.
    source: https://github.com/jthingelstad/elixir-bot
  - kind: lineage
    to: clash-royale-api-agent-reference
    label: gave rise to
    detail: The Clash Royale API notes began inside Elixir Bot as cr-api-docs before becoming a standalone reference.
    source: https://www.thingelstad.com/2026/03/10/automatic-programming-speed.html
  - to: otto
    label: was first coded by
    detail: Otto wrote the first version of the bot, a templated command-and-response Discord bot.
    source: https://weekly.thingelstad.com/archive/342/
  - to: poap-kings
    label: published
    detail: The bot regenerated the clan website’s roster pages, member bios, and home page message and committed them to git.
    source: https://sessions.minnestar.org/sessions/2094
  - kind: lineage
    to: weekly-thing-workshop
    label: led to
    detail: Running Elixir showed me that “Discord is a reasonable place for an agent to run,” so I put the Weekly Thing Workshop’s agents there.
    source: https://www.thingelstad.com/2026/05/12/the-weekly-thing-team.html
---

Elixir Bot was the agent for POAP KINGS, the Clash Royale clan Jamie runs with his son Tyler and Tyler’s cousin Levi. He wanted [his own agent](https://weekly.thingelstad.com/archive/342/) so he could understand the agentic loop, data design, and memory from the inside: one that would monitor the clan, help it win wars, suggest strategies, and recommend promotions and demotions to leadership. In the interview he put the premise in one line: [“could an agent help me run and manage a Clash Royale clan?”](https://thingelstad.xyz/interviews/jamie-october-2026/#q14)

It grew fast in early 2026. Otto wrote the first version, a templated Discord bot. An LLM and a journal kept on the clan website [gave it a brain](https://ottoai.thingelstad.com/2026/03/01/building-elixir-when-a-discord.html), an hourly heartbeat and a SQLite memory made it agentic, and a long session with Codex [rebuilt its data and tools](https://ottoai.thingelstad.com/2026/03/07/from-snapshots-to-signals-elixirs.html) around signals. Later Jamie gave it an [agentic product team](https://www.thingelstad.com/2026/06/22/elixirs-agentic-product-team.html) of scheduled automations that proposed, built, and checked its changes. Tyler and Jamie told its story at Minnebar 20 in the session “[Elixir: Creating an AI Agent for our Clash Royale Clan](https://sessions.minnestar.org/sessions/2094).”

Jamie retired Elixir Bot on September 26, 2026. Its work lives on in the projects that grew out of it: Elixir records the game, the Collector fetches from the API, Elixir Discord talks in the clan’s Discord, Elixir Clan handles management and awards, and Elixir Drop is the game. The [repository](https://github.com/jthingelstad/elixir-bot) is archived as it was on the last day. What happened, in his words, was [“retrospectively looking at everything we built in the bot and realizing that we could decompose it into individual capabilities that each operated better and kind of reverse the whole stack like flip it inside out into a data platform”](https://thingelstad.xyz/interviews/jamie-october-2026/#q14).
