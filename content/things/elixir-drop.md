---
title: Elixir Drop
summary: A free browser game from POAP KINGS for learning Clash Royale cards and their elixir costs, in six fast game modes.
collection: Games and communities
status: active
url: https://drop.poapkings.com/
started: '2026-06-13'
topics:
  - play
sources:
  - kind: github
    repository: jthingelstad/drop.poapkings.com
    role: implementation
  - kind: website
    url: https://drop.poapkings.com/
    role: website
    sitemap: https://drop.poapkings.com/sitemap.xml
    feed: https://drop.poapkings.com/feed.xml
connections:
  - to: elixir
    label: signs players in and reads its season clock from
    detail: Drop players sign in with their Elixir account, and Drop’s seasons follow the Clan Wars clock that Elixir records.
    source: https://poapkings.com/elixir/
story:
  color: '#6a4fc4'
  introduction: See a card, name its cost, get quicker.
  engineering:
    - Six modes train one skill, from unranked Practice to the 15-card Surge sprint.
    - Ranked online games deal from a signed server challenge drawn from the complete card catalog.
    - Seasonal leaderboards follow the Clan Wars clock, and a Fair Play review checks leading results without treating an automated signal as a verdict.
    - A Preact browser app served from S3 behind CloudFront, with a Lambda API and DynamoDB.
  stack:
    - Preact
    - TypeScript
    - AWS Lambda
    - DynamoDB
  source: https://drop.poapkings.com/updates/
  sourceLabel: Drop updates
  related:
    - elixir
    - poap-kings
  questions:
    - What are the six ways to play?
    - How do Drop’s seasons and leaderboards work?
---

Elixir Drop is a game for learning Clash Royale card elixir costs. Knowing a card’s cost instantly leaves more attention for everything else in a match, so each mode trains that recall from a different angle: Practice, Surge, Higher / Lower, Trade, Survival, and Rain. Every mode works without an account. Signing in saves progress, badges, and ranked scores.

POAP KINGS, my Clash Royale clan, runs it, and I count it among the things I have built with coding agents, [even making a game](https://www.thingelstad.com/2026/09/17/building-and-puzzling-about-software.html). [The first card dropped](https://drop.poapkings.com/updates/) on June 13, 2026, with Practice. Surge, Higher / Lower, and Survival arrived the same day and Trade the next. Accounts, player profiles, and the first seasonal ladder followed in July, and the game moved to AWS on August 22.

Players could [sign in with Elixir](https://elixir.poapkings.com/docs/sign-in-with-elixir) from September 14, 2026, and now it is the only way in: a Drop account is an Elixir account, and Drop sends no sign-in mail of its own. Selected seasonal competitions award a gifted Pass Royale, funded by the clan, to the top eligible player, and the [updates feed](https://drop.poapkings.com/updates/) announces new features and season results.
