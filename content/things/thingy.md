---
title: Thingy
summary: An AI librarian that answers questions about everything I have published, with citations back to the original posts and issues.
collection: Publishing
status: active
url: https://thingy.thingelstad.com/
started: '2026-05-07'
topics:
  - agents
  - open-web
  - archives
sources:
  - kind: github
    repository: jthingelstad/thingy.thingelstad.com
    role: implementation
  - kind: website
    url: https://thingy.thingelstad.com/
    role: website
    sitemap: https://thingy.thingelstad.com/sitemap.xml
  - kind: website
    url: https://thingy.thingelstad.com/about/
    role: reference
  - kind: website
    url: https://www.thingelstad.com/2026/06/07/thingy-evolved.html
    role: reference
connections:
  - to: weekly-thing
    label: answers from
    detail: Thingy launched with the new Weekly Thing website in May 2026 and answers from every issue of the newsletter.
    source: https://www.thingelstad.com/2026/05/07/massive-weekly-thing-website-build.html
  - to: jamie-thingelstad-blog
    label: answers from
    detail: In June 2026 I built a semantic archive of my blog so Thingy could search it alongside the newsletter.
    source: https://www.thingelstad.com/2026/06/07/thingy-evolved.html
  - to: another-thing
    label: answers from
    detail: Thingy searches the Another Thing podcast and its transcripts.
    source: https://thingy.thingelstad.com/about/
story:
  color: '#6f8f6a'
  introduction: Ask the archive, get the sources.
  engineering:
    - A static React app built on assistant-ui, served from a private S3 bucket behind CloudFront.
    - It calls the Librarian API, streams answers over server-sent events, and renders citations and inline photos.
    - Sign-in is by email, and the session lives in an HttpOnly cookie.
    - While a reader is signed in, the chat page also offers the archive tools to agents in the browser through WebMCP, in beta.
  stack:
    - React
    - assistant-ui
    - Amazon S3
    - Amazon CloudFront
  source: https://thingy.thingelstad.com/about/
  sourceLabel: About Thingy
  related:
    - librarian
    - weekly-thing
    - jamie-thingelstad-blog
    - another-thing
  started: Launched May 2026
  questions:
    - What can Thingy answer?
    - How does Thingy find its sources?
---

Thingy is an AI librarian for my public archive. You ask it a question, such as when I first wrote about Ethereum or what I was reading in 2019, and it finds the posts and issues that answer it, quotes them, and links to the originals. It knows only what I have published. Weekly Thing subscribers sign in with their email, and Supporting Members get larger daily budgets.

I previewed it in [Weekly Thing 346](https://weekly.thingelstad.com/archive/346/) and launched it with the [new Weekly Thing website](https://www.thingelstad.com/2026/05/07/massive-weekly-thing-website-build.html) on May 7, 2026. A month later, [Thingy Evolved](https://www.thingelstad.com/2026/06/07/thingy-evolved.html) gave it its own site and three archives to search, the newsletter, the blog, and the podcast, along with saved conversations, curiosity maps, voice input, and memory. In September I added photos and shared conversations and [called it complete](https://www.thingelstad.com/2026/09/03/im-ready-to-call-thingy.html). In October it got [a new design](https://www.thingelstad.com/2026/10/07/thingy-my-digital-librarian-got.html), with Claude Sonnet for subscribers and Claude Opus for Supporting Members.

Thingy answers from Librarian, which also offers the same tools to other AI clients over MCP. Since [Weekly Thing 350](https://weekly.thingelstad.com/archive/350/), Thingy also writes two sections of each issue: Supporting Membership and Echoes, which connects the week’s topics to earlier issues.
