---
title: Elixir
summary: Clash Royale history, recorded.
collection: Games and communities
status: active
url: https://elixir.poapkings.com/
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
    source: https://elixir.poapkings.com/docs
  - to: poap-kings
    label: supplies clan data to
    detail: The POAP KINGS website reads clan and roster data from Elixir’s JSON API.
    source: https://poapkings.com/elixir/
story:
  color: '#8860d9'
  introduction: The game remembers the present. Elixir remembers what happened.
  engineering:
    - Independent collectors fetch public game observations from machines with allowlisted IP addresses.
    - One recorded history serves the browser application, a remote MCP server, and a versioned JSON API.
    - Clan management and Ladder are features of the same platform, sharing its record and application shell.
  stack:
    - React
    - TypeScript
    - PostgreSQL
    - AWS
    - MCP
  source: https://elixir.poapkings.com/docs
  sourceLabel: Documentation
  related:
    - elixir-drop
    - elixir-mcp-discord
    - elixir-mcp-collector
    - poap-kings
  questions:
    - How does Elixir keep the history?
    - What grew out of Elixir Bot?
---

The Clash Royale API offers a current snapshot and a short, rotating battle log. Elixir continuously records observations so players, clans, and their agents can ask questions about the history.

In the browser, Elixir is the Console for a player's own history and the [Ladder](https://elixir.poapkings.com/ladder) for exploring ladder results. Elixir Clan runs in the same application.
