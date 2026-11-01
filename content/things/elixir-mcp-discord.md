---
title: Elixir Discord
summary: 'An open-source Discord bot any Clash Royale clan can run. Every fact it states comes from an Elixir MCP tool call.'
collection: Games and communities
status: active
url: https://github.com/jthingelstad/elixir-mcp-discord
started: '2026-09'
topics:
  - agents
  - mcp
  - play
sources:
  - kind: github
    repository: jthingelstad/elixir-mcp-discord
    role: implementation
connections:
  - to: poap-kings
    label: is the Discord agent for
    detail: POAP KINGS runs an instance of the bot as its clan agent in Discord, answering members from Elixir’s record.
    source: https://poapkings.com/elixir/
---

Elixir Discord is a Discord bot for a Clash Royale clan with no local game database, no Clash Royale API key, and no fallback. It connects to [Elixir](https://elixir.poapkings.com/) as that clan’s agent, and every fact it states comes from an MCP tool call it made moments earlier. There is no clan baked into the repository. A clan points it at its own agent key, Claude key, and Discord channels. No fork, no code to edit.

Its behavior is a set of routines, each one a Markdown file that pairs a trigger with a prompt and a destination. A routine can answer whoever speaks in a channel, post when Elixir’s timeline records a join, a departure, or a standout session, fire on a game clock boundary like the end of a war day, or run on a schedule. The record is the trigger, not the calendar.

Jamie started it in September 2026, and its first release, [v0.3.0](https://github.com/jthingelstad/elixir-mcp-discord/releases/tag/v0.3.0), came on September 15. When he retired Elixir Bot on September 26, 2026, this bot [took over its Discord role](https://github.com/jthingelstad/elixir-bot) for POAP KINGS. Any other clan can run its own copy as [an agent of its own](https://elixir.poapkings.com/examples/discord).
