---
title: Things I’ve Built
summary: An index and archive of Jamie’s projects, including the ones he has stepped away from.
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
  - to: librarian
    label: publishes a catalog for
    detail: The registry is published as things.json and llms.txt so Librarian and Thingy can answer questions about Jamie’s projects without this site running a model.
    source: https://github.com/jthingelstad/thingelstad.xyz
---

Jamie keeps thingelstad.xyz for point-in-time project things. This site is the index: every project, active or retired, with its sources, its connections to other projects, and a sourced history of what happened when. The registry is written as Markdown and YAML in a public repository, evidence is collected weekly from GitHub, sitemaps, and feeds, and the result is a static site with an RSS feed and llms.txt.

Jamie started the repository in October 2026 as a project gallery with an AI guide. On [October 17, 2026](https://github.com/jthingelstad/thingelstad.xyz/pull/6) it became a static site built with Eleventy from the Markdown registry, and the AI guide, private editor and React application were [retired](https://github.com/jthingelstad/thingelstad.xyz/pull/8). [Librarian](https://github.com/jthingelstad/thingelstad.xyz/pull/9) indexes the published things.json, so Thingy can answer questions about the projects.
