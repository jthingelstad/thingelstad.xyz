---
title: Weekly Thing
summary: Jamie’s weekend newsletter of links with commentary, sent since May 2017 and published as a website, email, and podcast.
collection: Publishing
status: active
url: https://weekly.thingelstad.com/
started: '2017-05-13'
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
  - kind: website
    url: https://weekly.thingelstad.com/podcast/
    role: podcast
    feed: https://weekly.thingelstad.com/podcast.xml
  - kind: website
    url: https://www.thingelstad.com/2026/05/07/massive-weekly-thing-website-build.html
    role: reference
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
    - yearly-thing-2025
    - librarian
    - thingy
    - another-thing
  started: Published since 2017
  questions:
    - What is behind the publishing workflow?
    - How do Weekly Thing and Thingy connect?
---

The Weekly Thing is Jamie’s newsletter of links he found interesting, each with his commentary, plus his own blog posts from the week. He sent the [first issue](https://weekly.thingelstad.com/archive/1/) on May 13, 2017, and has sent it most weekends since, taking breaks in summer and over the winter holidays. It began on TinyLetter, moved to MailChimp with [issue 23](https://weekly.thingelstad.com/archive/23/) in October 2017, and moved to Buttondown with [issue 131](https://weekly.thingelstad.com/archive/131/) in January 2020.

In May 2026, at 345 issues, Jamie [rebuilt the website](https://www.thingelstad.com/2026/05/07/massive-weekly-thing-website-build.html) as a full archive with search, a table of contents for each issue, and Thingy for asking questions of the archive. Each issue also got an audio edition, published as a [podcast](https://weekly.thingelstad.com/podcast/). He built it with Claude Code, Claude Design, and Codex. Starting with [issue 350](https://www.thingelstad.com/2026/09/20/i-just-published-weekly-thing.html) in September 2026, every issue has been written and sent from WT Builder.

Since November 2024, readers can become [Supporting Members](https://www.thingelstad.com/2024/11/17/weekly-thing-supporting.html). All of that money goes to one digital non-profit each year: Creative Commons first, then the Electronic Frontier Foundation, which [received $1,164.92](https://weekly.thingelstad.com/archive/347/) in May 2026, and now [Signal](https://weekly.thingelstad.com/archive/350/).
