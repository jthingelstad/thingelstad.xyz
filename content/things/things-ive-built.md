---
title: Things I’ve built
summary: An index and archive of my projects, including the ones I have stepped away from.
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

I keep thingelstad.xyz for point-in-time project things. This site is the index: every project, active or retired, with its sources, its connections to other projects, and a sourced history of what happened when. The registry is written as Markdown and YAML in a public repository, evidence is collected weekly from GitHub, sitemaps, and feeds, and the result is a static site with an RSS feed and llms.txt.

I started the repository in October 2026 as a project gallery with an AI guide. On [October 17, 2026](https://github.com/jthingelstad/thingelstad.xyz/pull/6) it became a static site built with Eleventy from the Markdown registry, and the AI guide, private editor and React application were [retired](https://github.com/jthingelstad/thingelstad.xyz/pull/8). Thingy's archive [indexes](https://github.com/jthingelstad/thingelstad.xyz/pull/9) the published things.json, so it can answer questions about the projects.
