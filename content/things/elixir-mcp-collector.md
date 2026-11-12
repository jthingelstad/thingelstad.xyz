---
title: Elixir Collector
summary: 'A small, signed Go program that fetches Clash Royale API data for Elixir’s shared record, from machines whose addresses the API allows.'
collection: Games
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

The Clash Royale API only takes requests from allowlisted IP addresses, so Elixir’s fetching happens on machines with stable addresses that operators run. A collector leases a job from Elixir over HTTPS (“fetch this player,” “fetch this clan’s war”), calls the API with its operator’s own key, and posts the result back. It never picks its own targets, and it holds exactly two secrets: the operator’s Clash Royale key and a token Elixir issues. The whole fleet shares one rate budget, so more collectors mean more resilience, not more load on the API.

Fetching started inside the Elixir codebase and [got its own repository](https://elixir.poapkings.com/updates/2026-09-04-the-collector-gets-its-own-home) on September 4, 2026, the day after Elixir launched. Each collector wears a Clash Royale card as its public name, and [anyone with an Elixir account](https://elixir.poapkings.com/docs/operators) can run one. For now the operator is Jamie: [“Funny enough, right now I’m running all of them. There are currently five or six collectors, and I run them all.”](https://thingelstad.xyz/interviews/session-9/#q66) Jamie retired the Python collector on September 26, 2026, leaving one Go binary built on nothing but the Go standard library.

A collector is meant to know very little. [“We really just want the collector to be an API proxy between the server and the Clash Royale API.”](https://thingelstad.xyz/interviews/session-9/#q66) The one piece of logic it has is what he calls the smartest thing they did: the API hands back a player’s last 30 to 40 battles on every request, and the collectors [“get all the data, but they only send the server what’s new”](https://thingelstad.xyz/interviews/session-9/#q66).

That same day he used some of his Claude credits to build [a fully signed release pipeline](https://www.thingelstad.com/2026/09/26/i-used-some-of-my.html). From [v3.0.0](https://github.com/jthingelstad/elixir-mcp-collector/releases/tag/v3.0.0) on, every release is signed with a key he manages, and the self-updater installs only the version and checksum Elixir names.
