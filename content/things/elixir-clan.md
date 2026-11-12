---
title: Elixir Clan
summary: 'Clan management on Elixir. A clan writes its own policy, and Elixir reads the record against it to guide the leaders’ calls. It became part of Elixir on October 2, 2026.'
collection: Games
status: archived
url: https://elixir.poapkings.com/clan
started: '2026-09'
ended: '2026-10-02'
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

Elixir Clan is the part of Elixir for running a Clash Royale clan. Any player on a person’s Elixir account is a member of that player’s clan, and leaders who [verify their player](https://elixir.poapkings.com/docs/bring-your-clan) act in their in-game role. Each clan writes its own policy, and Elixir reads every week against it: [standing and the Elder band](https://elixir.poapkings.com/docs/standing), the [actions](https://elixir.poapkings.com/docs/clan-actions) waiting for a leader (promotions, welcomes, removals), season [awards](https://elixir.poapkings.com/docs/clan-awards), recruiting, and scouting. The decisions stay with the leaders. Elixir just makes sure they have the record in front of them.

The written policy came from POAP KINGS, and he knows of no other like it: [“the whole concept of a clan policy is novel to Elixir. To my knowledge it doesn’t exist anywhere else.”](https://thingelstad.xyz/interviews/session-9/#q68) What his own clan’s policy holds:

> In the POAP KINGS policy, the most interesting parts are a rate of participation for Clan Wars, a rule that you have to be a member for a certain number of weeks before you can be promoted to elder, and the idea I mentioned already, that we give you credit for how long you’ve been in the clan. If you go idle, people who have been in the clan a long time get more grace than people who joined recently.
>
> [Jamie, question 68](https://thingelstad.xyz/interviews/session-9/#q68)

Not every clan wants that much, so the policy bends: [“There are competitive clans and social clans, and we built the clan policy to accommodate both.”](https://thingelstad.xyz/interviews/session-9/#q68)

Jamie built it to turn the clan management features in [Elixir Bot](https://github.com/jthingelstad/elixir-bot) for POAP KINGS into [a proper product that anyone can use](https://weekly.thingelstad.com/archive/351/). It began in September 2026 as a separate app at clan.poapkings.com, in its own [repository](https://github.com/jthingelstad/clan.poapkings.com), with Sign in with Elixir.

On September 28, 2026, it [moved to /clan](https://elixir.poapkings.com/updates/2026-09-28-elixir-clan-lives-at-clan) on Elixir’s own address, and its code moved into the Elixir repository with its history. On October 2 it [became part of Elixir](https://elixir.poapkings.com/updates/2026-10-02-clan-is-part-of-elixir): one sign-in and one application, with every clan’s policies, actions, and awards carried over. The old repository is archived.
