---
title: Things I’ve built
summary: The index of everything I’ve built, including the things I’ve stepped away from.
collection: Art & archives
status: active
url: https://thingelstad.xyz/
started: '2026-10'
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
    sitemap: https://thingelstad.xyz/sitemap.xml
    feed: https://thingelstad.xyz/feed.xml
connections:
  - to: thingy
    label: publishes a catalog for
    detail: The registry is published as things.json and llms.txt so Thingy can answer questions about my projects without this site running a model.
    source: https://github.com/jthingelstad/thingelstad.xyz
---

thingelstad.xyz is where I keep the point-in-time things I make, and this site is the index of all of them. Every project, active or long retired, with its sources, how it connects to the other projects, and a sourced history of what happened when. The registry is Markdown and YAML in a public repository. Evidence comes in every day from GitHub, sitemaps, feeds, the Internet Archive, and Tinylytics, and the whole thing builds to a static site with an RSS feed and llms.txt.

I started the repository in October 2026 as a project gallery with an AI guide. On [October 17, 2026](https://github.com/jthingelstad/thingelstad.xyz/pull/6) it became a static site built with Eleventy from the Markdown registry, and the AI guide, private editor and React application were [retired](https://github.com/jthingelstad/thingelstad.xyz/pull/8). Thingy’s archive [indexes](https://github.com/jthingelstad/thingelstad.xyz/pull/9) the published things.json, so you can ask Thingy about any of these projects.

The words on this site are written as me, but I don’t type most of them. The [about page](https://thingelstad.xyz/about/) explains how that works.
