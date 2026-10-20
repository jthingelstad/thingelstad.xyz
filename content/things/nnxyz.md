---
title: The nnxyz Rooms
summary: An online gallery of my nnxyz and Scrimshaw collection, hung in 30 rooms, where each Nifty Ink drawing replays stroke by stroke.
collection: Art & archives
status: active
url: https://nnxyz.thingelstad.xyz/
started: '2026-10'
topics:
  - crypto
  - archives
sources:
  - kind: github
    repository: jthingelstad/nnxyz
    role: implementation
  - kind: website
    url: https://nnxyz.thingelstad.xyz/
    role: website
    sitemap: https://nnxyz.thingelstad.xyz/sitemap-index.xml
connections: []
story:
  color: '#8062a8'
  introduction: Collected art, with room to look closely.
  engineering:
    - Static artwork pages are built from a structured collection catalog.
    - Native SVG and archived stroke data let visitors inspect and replay how a drawing was made.
    - Saved curatorial readings and related works support exploration without a live model call.
  stack:
    - Astro
    - TypeScript
    - SVG
    - AWS
  source: https://github.com/jthingelstad/nnxyz
  related: []
  questions:
    - How does the gallery replay a drawing?
    - Show me other archive projects.
---

The nnxyz Rooms is a gallery of the art I collected from nnxyz, an artist on Nifty Ink, a free drawing board on the xDai chain that kept every stroke. As the gallery’s [story of the collector](https://nnxyz.thingelstad.xyz/story/the-collector/) tells it, I found Nifty Ink in March 2022, bought my first nnxyz drawing, Nifty Faces #109, on 2022-04-14, and kept buying until I held four complete series. Along with 646 nnxyz works the gallery holds 26 by Scrimshaw.

The works hang in 30 rooms across six collections, each with room texts, artwork labels, and its own audio tour, and a [map](https://nnxyz.thingelstad.xyz/map/) shows the collection as one building on three floors. Because Nifty Ink recorded every stroke, each drawing is rebuilt as a native vector image that can be enlarged, downloaded, or replayed as it was drawn. Story pages cover [Nifty Ink](https://nnxyz.thingelstad.xyz/story/nifty-ink/), which Austin Griffith opened in the summer of 2020 and where nnxyz arrived in October 2021, along with the collector, my fan art, the artist’s project, the year 2022, and the artist’s own words.

The collector’s introduction on the front page is mine. The [About page](https://nnxyz.thingelstad.xyz/about/) says the rest of the gallery text is unsigned, written from the works, their archived records, the public ledgers, and the artist’s posts. I built the site in October 2026 with Astro, from the archived drawings and their on-chain records.
