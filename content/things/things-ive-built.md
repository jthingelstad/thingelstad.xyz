---
title: Things I’ve Built
summary: An index and archive of Jamie’s projects, including the ones he has stepped away from.
collection: Art & archives
status: active
url: https://thingelstad.xyz/
started: 2026-10
topics:
  - archives
  - open-web
sources:
  - kind: github
    repository: jthingelstad/thingelstad.xyz
    role: implementation
  - kind: website
    url: https://thingelstad.xyz/
    role: website
connections:
  - to: librarian
    label: publishes a catalog for
    detail: The registry is published as things.json and llms.txt so Librarian and Thingy can answer questions about Jamie’s projects without this site running a model.
    source: https://github.com/jthingelstad/thingelstad.xyz
---

Jamie keeps thingelstad.xyz for point-in-time project things. This site is the index: every project, active or retired, with its sources, its connections to other projects, and a sourced history of what happened when. The registry is written as Markdown and YAML in a public repository, evidence is collected weekly from GitHub, sitemaps, and feeds, and the result is a static site with an RSS feed and llms.txt.
