---
title: Clash Royale API Agent Reference
summary: Public, agent-first documentation of how the Clash Royale API actually behaves, with observed response shapes, quirks, and game modes.
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

Rather than a thin endpoint list, this reference is written for LLM agents, coding agents, and API clients that need to know how the API really behaves: endpoint-by-endpoint notes on parameters, pagination, caching, and errors; field-level models drawn from live responses; endpoints that are broken, disabled, or removed; and the game modes beyond Trophy Road, so an agent does not treat one ladder as the whole game. Machine-readable files cover the mode taxonomy, card roles, and deck names.

It began inside [Elixir Bot](https://github.com/jthingelstad/elixir-bot) as cr-api-docs; in March 2026 Codex used it to [suggest a feature](https://www.thingelstad.com/2026/03/10/automatic-programming-speed.html) tracking ladder and Path of Legend momentum. It then became a standalone public repository. Copies kept inside other projects drifted, so they were removed, and [Elixir](https://github.com/jthingelstad/elixir-mcp/blob/main/AGENTS.md) and Elixir Drop now treat this one repository as their Clash Royale API truth.

Its [agent guide](https://github.com/jthingelstad/cr-agent-api-docs/blob/main/AGENTS.md) asks any agent the live API surprises to write the finding down here, after checking the claim with a live probe tool. Observed enum values are guarded by the docs build, so a later rewrite cannot quietly drop them. It is an unofficial fan reference under Supercell’s Fan Content Policy.
