---
pull:
  n: 63
  words: 'I thought it would be fun to build a real clan, one that actually works to compete and go up the ladder.'
title: POAP KINGS
summary: 'The website of POAP KINGS, the Clash Royale clan of Jamie’s family, with its roster, data, and season recognition.'
tagline: 'The Clash Royale clan of Jamie’s family: roster, data, and season recognition.'
collection: Games
status: active
url: https://poapkings.com/
started: '2026-02'
topics:
  - poap
  - crypto
  - play
sources:
  - kind: github
    repository: jthingelstad/poapkings.com
    role: implementation
  - kind: website
    url: https://poapkings.com/
    role: website
    sitemap: https://poapkings.com/sitemap.xml
connections:
  - to: elixir-drop
    label: runs
    detail: POAP KINGS runs Elixir Drop, its card-recognition and elixir-cost training game.
    source: https://poapkings.com/elixir-drop/
---

POAP KINGS (#J2RGCRVG) is the Clash Royale clan Jamie started in early 2026 with his son Tyler and Tyler’s cousin Levi. He had [taken up the game](https://www.thingelstad.com/2025/09/27/after-following-tyler-to-pokmon.html) in September 2025 as a total newcomer, trying one of Tyler’s favorite games. In the [clan’s own words](https://poapkings.com/faq/), Raquaza and King Levy had cycled through clans that never quite fit, so the family built the clan it wanted: structure, recognition, and something lasting to show for the grind. Jamie claimed the [POAP KINGS Founder](https://www.thingelstad.com/2026/02/05/poap-at-poap-kings-founder.html) POAP on February 5, 2026, and by July the clan had [reached 50 members](https://www.thingelstad.com/2026/07/26/i-made-this-fun-slab.html) for the first time.

How he came to the game, in his words:

> Then I started looking at it a little, and, funny enough, I had decided that I didn’t have enough things I did on the internet that were just fun. A lot of what I do is build stuff, blog, and write the newsletter. I thought I should have some things online that aren’t about creating, just experiencing. I knew Tyler was really into Clash, and I thought it would be a fun thing for us to do together. So I created a profile and asked him to be my coach, and he coached me up really well.
>
> [Jamie, question 63](https://thingelstad.xyz/interviews/session-9/#q63)

The clan came a couple of months later. [“I thought it would be fun to build a real clan, one that actually works to compete and go up the ladder.”](https://thingelstad.xyz/interviews/session-9/#q63) Tyler was in, and said to ask Levi: [“That was the origin of POAP KINGS.”](https://thingelstad.xyz/interviews/session-9/#q63) From the start they wanted written rules, [“so people knew what was needed to be promoted to elder, rather than basing every decision on vibes”](https://thingelstad.xyz/interviews/session-9/#q68).

The name comes from POAP. The clan started out publishing POAP collectibles for seasons and milestones. When the POAP company and product stopped operating, the clan kept the name and the meaning it had taken on inside the clan, “Proof of Arena Push.”

Jamie asked Codex to [build the website](https://weekly.thingelstad.com/archive/342/) from the notes the three founders had kept, and it was live fast. Claude Code did much of the later work, design included. In April 2026 a new blog feature had made the design “unruly,” so he pointed Claude Design at the repository and it produced the current look ([Weekly Thing 345](https://weekly.thingelstad.com/archive/345/)). Asked how he decides which agent gets which job, he said that now [“by far most of the coding is done by Claude and most of the design by Claude Design, but Codex is very active reviewing every single pull request”](https://thingelstad.xyz/interviews/session-10/#q74). It grew into an Eleventy site on GitHub Pages with a sortable roster, an interactive data page, member guidance, season recognition, and pages for the clan’s sister clans, Ship It! and Elixir Kings. The roster and war data come from Elixir’s JSON API, and the site promotes the tools the clan built: Elixir and Elixir Drop.
