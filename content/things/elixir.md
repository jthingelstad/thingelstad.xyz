---
title: Elixir
summary: A service that records Clash Royale history and serves it to players, clans, and their AI agents over MCP.
collection: Games and communities
status: active
url: https://elixir.poapkings.com/
started: '2026-09-03'
topics:
  - agents
  - mcp
  - play
sources:
  - kind: github
    repository: jthingelstad/elixir-mcp
    role: implementation
  - kind: website
    url: https://elixir.poapkings.com/
    role: website
    sitemap: https://elixir.poapkings.com/sitemap.xml
    feed: https://elixir.poapkings.com/feed.xml
connections:
  - to: elixir-mcp-discord
    label: provides recorded facts to
    detail: The configurable Discord agent gets its game facts through Elixir MCP tools.
    source: https://github.com/jthingelstad/elixir-mcp-discord
  - to: elixir-clan
    label: includes
    detail: Clan management is a feature of the same Elixir platform and shares its recorded history, application, and runtime.
    source: https://elixir.poapkings.com/updates/2026-10-02-clan-is-part-of-elixir
  - to: poap-kings
    label: supplies clan data to
    detail: The POAP KINGS website reads clan and roster data from Elixir’s JSON API.
    source: https://poapkings.com/elixir/
story:
  color: '#8860d9'
  introduction: The game remembers the present. Elixir remembers what happened.
  engineering:
    - Independent collectors fetch public game observations from machines with allowlisted IP addresses, sharing one rate budget.
    - One recorded history serves the browser application, a remote MCP server, and a versioned JSON API.
    - Everything cloud-side is serverless, with PostgreSQL, S3, and Lambda functions in one CloudFormation stack.
    - Clan management and Ladder are features of the same platform, sharing its record and application shell.
  stack:
    - Eleventy
    - React
    - PostgreSQL
    - AWS Lambda
    - MCP
  source: https://elixir.poapkings.com/docs/architecture
  sourceLabel: Architecture
  related:
    - elixir-drop
    - elixir-mcp-discord
    - elixir-mcp-collector
    - poap-kings
  questions:
    - How does Elixir keep the history?
    - What grew out of Elixir Bot?
---

The Clash Royale API offers a current snapshot and a short, rotating battle log of about 30 battles. Elixir continuously records observations so players, clans, and their agents can ask questions about the history: battles, rosters, river races, and seasons.

I built it by turning [Elixir Bot](https://github.com/jthingelstad/elixir-bot), the POAP KINGS clan agent, “upside-down.” Instead of one bot keeping its own database, the record became a service that any agent can use over MCP. Claude and I wrote the specification, then put Claude Code in a loop; [six hours later](https://www.thingelstad.com/2026/09/03/i-had-an-idea-to.html) there was a working system, and [Elixir MCP launched](https://elixir.poapkings.com/updates/2026-09-03-elixir-mcp-launches) on September 3, 2026. The next day the old bot’s archive was [replayed into the recorder](https://elixir.poapkings.com/updates/2026-09-04-four-months-of-history-imported), bringing battles back to mid-May.

In the browser, Elixir is the Console for a player’s own history and the [Ladder](https://elixir.poapkings.com/ladder) for exploring ladder results. Elixir Clan runs in the same application, and Elixir Drop signs its players in with Elixir. Volunteer collectors do all of the fetching. Elixir is free, and its [updates feed](https://elixir.poapkings.com/updates) records every user-visible change.
