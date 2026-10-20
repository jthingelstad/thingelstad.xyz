---
title: Elixir Collector
summary: A small, signed Go program that volunteers run on their own machines to fetch Clash Royale API data for Elixir’s shared record.
collection: Games and communities
status: active
url: https://github.com/jthingelstad/elixir-mcp-collector
started: '2026-09-04'
topics:
  - mcp
  - play
sources:
  - kind: github
    repository: jthingelstad/elixir-mcp-collector
    role: implementation
  - kind: website
    url: https://elixir.poapkings.com/docs/operators
    role: reference
connections:
  - to: elixir
    label: gathers observations for
    detail: Collectors lease work from Elixir, fetch public observations from the Clash Royale API, and submit the results.
    source: https://elixir.poapkings.com/docs/operators
---

The Clash Royale API only accepts requests from allowlisted IP addresses, so Elixir’s fetching happens on machines with stable addresses that volunteers run. A collector leases a job from Elixir over HTTPS (“fetch this player,” “fetch this clan’s war”), calls the API with its operator’s own key, and posts the result back. It never chooses its own targets and holds exactly two secrets: the operator’s Clash Royale key and a token Elixir issues. The whole fleet shares one rate budget, so more collectors add resilience, not more load on the API.

Fetching started inside the Elixir codebase and [got its own repository](https://elixir.poapkings.com/updates/2026-09-04-the-collector-gets-its-own-home) on September 4, 2026, the day after Elixir launched. Each collector wears a Clash Royale card as its public name, and [anyone with an Elixir account](https://elixir.poapkings.com/docs/operators) may run one. A Python collector was retired on September 26, 2026, leaving one Go binary built only on the Go standard library.

The same day, I used Claude credits to build [a fully signed release pipeline](https://www.thingelstad.com/2026/09/26/i-used-some-of-my.html): from [v3.0.0](https://github.com/jthingelstad/elixir-mcp-collector/releases/tag/v3.0.0), every release is signed with a key I manage, and the self-updater installs only the version and checksum Elixir names.
