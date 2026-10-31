---
title: Flight Path
summary: A rotating globe of the 2026 POAP Airport Rally with claims, a leaderboard, and each collector’s path, built from an iPhone.
collection: Games and communities
status: retired
url: https://web.archive.org/web/20260312035500/https://flightpath.poaprally.com/
started: '2026-02-25'
ended: '2026-07-24'
topics:
  - poap
  - agents
sources:
  - kind: github
    repository: jthingelstad/flightpath.poaprally.com
    role: implementation
  - kind: website
    url: https://weekly.thingelstad.com/archive/342/
    role: reference
  - kind: website
    url: https://www.thingelstad.com/2026/02/25/it-is-bonkers-to-me.html
    role: reference
  - kind: website
    url: https://web.archive.org/web/20260312035500/https://flightpath.poaprally.com/
    role: archive
connections: []
---

Flight Path lived at flightpath.poaprally.com and extended POAP’s year-long Airport POAP Rally, which put location POAPs at 100 airports around the world and which I already followed on my [Airport POAP Rally](https://www.thingelstad.com/2025/12/26/airport-poap-rally-website.html) site. It showed a rotating globe with every rally airport and the number of claims at each, a leaderboard of collectors, and any one collector’s own path around the world.

As I told it in [Weekly Thing 342](https://weekly.thingelstad.com/archive/342/), I built it on the evening of February 25, 2026, in bed, entirely on my iPhone. I worked out the idea with ChatGPT, had it write a CLAUDE.md, created a fresh GitHub repository on my phone with that file and my CSV of rally airports and drop IDs, and attached a cloud Claude Code session to it. While Claude Code wrote the site I set up the DNS name and GitHub Pages, and it worked on the first deploy. [It is bonkers to me](https://www.thingelstad.com/2026/02/25/it-is-bonkers-to-me.html) that this is possible. In late March 2026 the [repository](https://github.com/jthingelstad/flightpath.poaprally.com) gained teams, maps, and a daily data update.

Flight Path read live POAP claim data, so it could not outlive POAP. On July 24, 2026, a week before POAP shut down, I [replaced the site](https://github.com/jthingelstad/flightpath.poaprally.com/commit/fea8eac46878b7ab9afa418c48193b4139d8a06b) with a notice that the rally had ended, pointing to poaparchive.com, removed the daily update, and archived the repository. The host no longer answers. A [March 2026 capture](https://web.archive.org/web/20260312035500/https://flightpath.poaprally.com/) preserves the site as it ran.
