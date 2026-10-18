---
title: Proof of a Person
summary: Jamie’s POAP time capsule, 2021 to 2026, built from an archive captured after the protocol wound down.
collection: Art & archives
status: active
url: https://poap.thingelstad.xyz/
started: '2026-10-17'
topics:
  - poap
  - crypto
  - archives
sources:
  - kind: github
    repository: jthingelstad/poap.thingelstad.xyz
    role: implementation
  - kind: github
    repository: jthingelstad/poap-archive
    role: archive
  - kind: website
    url: https://poap.thingelstad.xyz/
    role: website
    sitemap: https://poap.thingelstad.xyz/sitemap-index.xml
connections:
  - to: poap2rss
    label: tells the story of
    detail: The capsule’s writing traces POAP2RSS back to Jamie’s 2023 POAP Wishlist, where he asked POAP for RSS feeds. “RSS never came from POAP, so Jamie built it.”
    source: https://poap.thingelstad.xyz/
  - to: 612-poap-challenge
    label: preserves
    detail: The 612 POAP Challenge drops are one of the series on the capsule’s Issued page, and the archive keeps a mirror of the challenge site.
    source: https://poap.thingelstad.xyz/issued/
---

Proof of Attendance Protocol entered maintenance mode in March 2026 and wound down that summer. On 2026-10-17 Jamie captured his whole POAP life into a public [archive](https://github.com/jthingelstad/poap-archive): every token he collected, every drop he created, the people who minted them, and the posts and Weekly Thing sections he wrote about POAP from 2021 on. The tokens themselves stay on the Gnosis chain; the archive keeps the records and artwork that lived on POAP’s own services.

[Proof of a Person](https://poap.thingelstad.xyz/) is the time capsule built from that archive and published the same day. It counts 259 tokens collected, from the ENS 4th Anniversary vote on 2021-06-07 to an airport rally stop at Seattle-Tacoma in July 2026, and 130 drops issued, which 639 people minted. Each year from 2021 to 2026 is a chapter headed by a line from Jamie’s own posts. The pages show the timeline as two sides, what Jamie collected and what he made for other people, with a network of the people who hold his drops, his writing about POAP, and a short history of the company.

The site is a static Astro build from a JSON export of the archive. Drop artwork is served from a copy taken from POAP’s asset host while it was still up.
