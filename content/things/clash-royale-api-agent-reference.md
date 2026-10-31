---
title: Clash Royale API Agent Reference
summary: Agent-first documentation of how the Clash Royale API actually behaves, with observed response shapes, quirks, and every game mode.
collection: Games and communities
status: active
url: https://github.com/jthingelstad/cr-agent-api-docs
started: '2026-03'
topics:
  - agents
  - play
sources:
  - kind: github
    repository: jthingelstad/cr-agent-api-docs
    role: implementation
connections:
  - to: elixir
    label: supplies game reference data to
    detail: Elixir’s deck archetype labels and card roles come from data files in the reference.
    source: https://elixir.poapkings.com/docs/archetypes
---

This is not a thin endpoint list. I wrote it for LLM agents, coding agents, and API clients that need to know how the API really behaves: endpoint-by-endpoint notes on parameters, pagination, caching, and errors, field-level models drawn from live responses, the endpoints that are broken, disabled, or removed, and the game modes beyond Trophy Road, so an agent doesn’t treat one ladder as the whole game. Machine-readable files cover the mode taxonomy, card roles, and deck names.

It started inside [Elixir Bot](https://github.com/jthingelstad/elixir-bot) as cr-api-docs. In March 2026 Codex read it and used it to [suggest a feature](https://www.thingelstad.com/2026/03/10/automatic-programming-speed.html) for tracking ladder and Path of Legend momentum. Then it became a public repository of its own. The copies I had kept inside other projects drifted, so I removed them, and now [Elixir](https://github.com/jthingelstad/elixir-mcp/blob/main/AGENTS.md) and Elixir Drop treat this one repository as the truth about the Clash Royale API.

Its [agent guide](https://github.com/jthingelstad/cr-agent-api-docs/blob/main/AGENTS.md) asks any agent that gets surprised by the live API to write the finding down here, after checking the claim with a live probe tool. The docs build guards the observed enum values, so a later rewrite can’t quietly drop them. It is an unofficial fan reference under Supercell’s Fan Content Policy.
