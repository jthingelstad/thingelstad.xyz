---
title: Elixir Clan
summary: Clan management on Elixir, where a clan’s own written policy is run against the record to guide its leaders’ calls.
collection: Games and communities
status: active
url: https://elixir.poapkings.com/clan
started: '2026-09'
topics:
  - play
sources:
  - kind: github
    repository: jthingelstad/elixir-mcp
    role: implementation
    path: packages/clan
  - kind: github
    repository: jthingelstad/elixir-mcp
    role: implementation
    path: packages/clan-engine
  - kind: github
    repository: jthingelstad/elixir-mcp
    role: implementation
    path: packages/clan-state
  - kind: github
    repository: jthingelstad/elixir-mcp
    role: implementation
    path: packages/clan-web
  - kind: website
    url: https://elixir.poapkings.com/clan
    role: website
  - kind: github
    repository: jthingelstad/clan.poapkings.com
    role: historical
connections:
  - to: poap-kings
    label: runs the clans of
    detail: POAP KINGS and its sister clans run on Elixir Clan for standing, the Elder band, and leader actions.
    source: https://poapkings.com/elixir/
---

Elixir Clan is the part of Elixir for running a Clash Royale clan. Any player on a person’s Elixir account is a member of that player’s clan, and leaders who [verify their player](https://elixir.poapkings.com/docs/bring-your-clan) act in their in-game role. Each clan writes its own policy, and Elixir reads every week against it: [standing and the Elder band](https://elixir.poapkings.com/docs/standing), the [actions](https://elixir.poapkings.com/docs/clan-actions) waiting for a leader (promotions, welcomes, removals), season [awards](https://elixir.poapkings.com/docs/clan-awards), recruiting, and scouting. Decisions stay with the leaders.

Jamie built it to take the clan management features he had built into [Elixir Bot](https://github.com/jthingelstad/elixir-bot) for POAP KINGS and turn them into [a proper product that anyone can use](https://weekly.thingelstad.com/archive/351/). It began in September 2026 as a separate app at clan.poapkings.com, in its own [repository](https://github.com/jthingelstad/clan.poapkings.com), with Sign in with Elixir.

On September 28, 2026, it [moved to /clan](https://elixir.poapkings.com/updates/2026-09-28-elixir-clan-lives-at-clan) on Elixir’s own address, and its code moved into the Elixir repository with its history. On October 2 it [became part of Elixir](https://elixir.poapkings.com/updates/2026-10-02-clan-is-part-of-elixir): one sign-in and one application, with every clan’s policies, actions, and awards carried over. The old repository is archived.
