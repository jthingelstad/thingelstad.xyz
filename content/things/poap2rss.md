---
title: POAP2RSS
summary: RSS feeds of claims for any POAP drop or collector, retired when the POAP API went offline in July 2026.
collection: Historical projects
status: retired
url: https://poap2rss.com/
started: '2025-07-04'
ended: '2026-07-24'
topics:
  - poap
  - crypto
  - open-web
sources:
  - kind: github
    repository: jthingelstad/POAP2RSS
    role: implementation
  - kind: website
    url: https://poap2rss.com/
    role: reference
  - kind: website
    url: https://www.thingelstad.com/2025/07/06/vibe-coding-poaprss.html
    role: reference
connections:
  - to: jamie-thingelstad-blog
    label: posts claims to
    detail: Jamie configured Micro.blog so that each POAP he mints becomes a post on his blog, from his POAP2RSS feed.
    source: https://weekly.thingelstad.com/archive/326/
---

POAP2RSS turned POAP activity into standard RSS: put a drop’s event ID or a collector’s address in the URL and get a feed of the latest claims, with the drop artwork and the collector’s ENS name or address as the author. Jamie issued many drops and wanted to know when they were claimed, and wanted to follow friends’ collecting in [Feedbin](https://www.thingelstad.com/2025/07/04/seeing-poap-claims-show-up.html) and connect claims to automation services like IFTTT and Zapier. He had asked POAP for RSS in his [POAP Wishlist](https://www.thingelstad.com/2023/01/14/poap-wishlist.html) in 2023 and again in [POAP + RSS = Awesome?](https://www.thingelstad.com/2025/01/05/poap-rss-awesome.html) in January 2025.

In mid-2025 he built it himself, his first project with AI writing nearly all of the code. [Vibe Coding POAP2RSS](https://www.thingelstad.com/2025/07/06/vibe-coding-poaprss.html) tells how: a throwaway prototype with Claude, a feature description researched with ChatGPT o3 and Deep Research, and then a Python AWS Lambda behind API Gateway. He declared it [officially launched](https://www.thingelstad.com/2025/07/04/i-decided-to-declare-poaprss.html) on Independence Day 2025 and marked the occasion with a POAP. The [changelog](https://poap2rss.com/changelog/) records later changes: feeds grew from 20 to 50 items, inactivity notices waited 12 weeks and could be switched off, pagination arrived for large drops, and a green-screen redesign in February 2026. POAP2RSS fed the claim streams of the 612 POAP Challenge and the Airport POAP Rally sites.

The service read live claims through the POAP API, so it stopped working when POAP wound down. Jamie [retired it](https://github.com/jthingelstad/POAP2RSS/commit/22798583f396bd59771b0e4ee320d20c51d18f20) on July 24, 2026, a week before POAP’s July 31 shutdown, archived the repository, and replaced the home page with a notice pointing to the POAP team’s archive at poaparchive.com, “with gratitude to Isabel, Patricio, and the whole POAP team.”
