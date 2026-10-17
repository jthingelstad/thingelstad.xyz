---
title: Weekly Thing
summary: A weekly collection of links and ideas.
collection: Publishing
status: active
url: https://weekly.thingelstad.com/
topics:
  - open-web
  - archives
sources:
  - kind: github
    repository: jthingelstad/weekly.thingelstad.com
    role: implementation
  - kind: website
    url: https://weekly.thingelstad.com/
    role: website
    sitemap: https://weekly.thingelstad.com/sitemap.xml
    feed: https://weekly.thingelstad.com/feed.xml
connections:
  - to: librarian
    label: is indexed by
    detail: Librarian builds a searchable corpus from Weekly Thing content.
    source: https://thingy.thingelstad.com/about/
story:
  color: '#eaa18f'
  introduction: Curiosity, collected and shared.
  engineering:
    - WT Builder keeps an issue structured until it is sent, then renders different editions for the website, email, and audio.
    - The public archive is an Eleventy site. Librarian builds the searchable archive that Thingy answers from.
    - Authoring, public publishing, and archive retrieval have explicit ownership boundaries.
  stack:
    - Eleventy
    - Publishing
    - Email
    - Audio
  source: https://weekly.thingelstad.com/
  sourceLabel: Read the archive
  related:
    - wt-builder
    - librarian
    - thingy
    - another-thing
  started: Published since 2017
  questions:
    - What is behind the publishing workflow?
    - How do Weekly Thing and Thingy connect?
---

A weekly collection of interesting links, ideas, and observations from across the internet. Its publishing tools grew alongside the newsletter, from a Shortcuts workflow into a dedicated authoring application.
