---
title: Flight Path
summary: A rotating globe of the 2026 POAP Airport Rally with claims, a leaderboard, and each collector’s path, built from an iPhone.
collection: Games and communities
status: retired
url: https://web.archive.org/web/20260312035500/https://flightpath.poaprally.com/
started: '2026-02-25'
ended: '2026-07'
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

Flight Path lived at flightpath.poaprally.com and extended POAP’s year-long [Airport POAP Rally](https://www.thingelstad.com/2025/12/26/airport-poap-rally-website.html), which put location POAPs at 100 airports around the world. It showed a rotating globe with every rally airport and the number of claims at each, a leaderboard of collectors, and any one collector’s own path.

Jamie built it on the evening of 2026-02-25, in bed, entirely on his iPhone, as he told it in [Weekly Thing 342](https://weekly.thingelstad.com/archive/342/). He worked out the idea with ChatGPT, had it write a CLAUDE.md, created a fresh GitHub repository on his phone with that file and his CSV of rally airports and drop IDs, and attached a cloud Claude Code session to it. While Claude Code wrote the site he set up the DNS name and GitHub Pages, and it worked on the first deploy. He called it [bonkers](https://www.thingelstad.com/2026/02/25/it-is-bonkers-to-me.html). In late March 2026 the [repository](https://github.com/jthingelstad/flightpath.poaprally.com) added teams, maps, and a daily data update.

Flight Path read live POAP claim data, so it could not outlive POAP. In July 2026 Jamie replaced the site with a notice that the rally had ended, pointing to poaparchive.com, removed the daily update, and archived the repository. The host no longer answers; a [March 2026 capture](https://web.archive.org/web/20260312035500/https://flightpath.poaprally.com/) preserves the site as it ran.
