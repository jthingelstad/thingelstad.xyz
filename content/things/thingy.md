---
title: Thingy
summary: An AI librarian that answers questions about everything I have published, with citations back to the original posts and issues.
collection: Publishing
status: active
url: https://thingy.thingelstad.com/
started: '2026-05-07'
topics:
  - agents
  - mcp
  - open-web
  - archives
sources:
  - kind: github
    repository: jthingelstad/thingy.thingelstad.com
    role: implementation
  - kind: github
    repository: jthingelstad/librarian-thing
    role: implementation
  - kind: website
    url: https://thingy.thingelstad.com/
    role: website
    sitemap: https://thingy.thingelstad.com/sitemap.xml
  - kind: website
    url: https://librarian.thingelstad.com/mcp
    role: mcp
  - kind: website
    url: https://thingy.thingelstad.com/about/
    role: reference
  - kind: website
    url: https://thingy.thingelstad.com/connect/
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
  - to: things-ive-built
    label: indexes
    detail: Librarian snapshots the registry’s things.json into the Weekly Thing corpus, so Thingy and MCP clients can answer questions about my projects (sources thing-<id> and thing-index).
    source: https://github.com/jthingelstad/librarian-thing/tree/main/data/things
  - to: wt-builder
    label: receives issues from
    detail: After each issue publishes, WT Builder commits the issue text into the Librarian repository so Thingy can retrieve and cite it.
    source: https://github.com/jthingelstad/librarian-thing
story:
  color: '#6f8f6a'
  introduction: Ask the archive, get the sources.
  engineering:
    - A static React app built on assistant-ui, served from a private S3 bucket behind CloudFront.
    - It calls Librarian, its private archive API, streams answers over server-sent events, and renders citations and inline photos.
    - Librarian's Python corpus pipeline builds chunked, embedded indexes of every source, and a Node API on AWS Lambda answers from them.
    - Retrieval is hybrid. TF-IDF lexical search and semantic embeddings are fused with reciprocal-rank fusion, then reranked.
    - An agent loop running Claude on Amazon Bedrock plans tool calls, gathers evidence, and writes cited answers.
    - The same tools are published as an MCP server with OAuth 2.1 sign-in, and a suite of more than 850 fixtures runs on every deploy.
    - Sign-in is by email, and the session lives in an HttpOnly cookie.
    - While a reader is signed in, the chat page also offers the archive tools to agents in the browser through WebMCP, in beta.
  stack:
    - React
    - assistant-ui
    - Python
    - Node
    - AWS Lambda
    - Amazon Bedrock
    - MCP
    - Amazon S3
    - Amazon CloudFront
  source: https://thingy.thingelstad.com/about/
  sourceLabel: About Thingy
  related:
    - weekly-thing
    - jamie-thingelstad-blog
    - another-thing
  started: Launched May 2026
  questions:
    - What can Thingy answer?
    - How does Thingy find its sources?
    - How can I connect my own AI to the archive?
---

Thingy is an AI librarian for my public archive. You ask it a question, like when I first wrote about Ethereum or what I was reading in 2019, and it finds the posts and issues that answer it, quotes them, and links to the originals. It knows only what I have published. Weekly Thing subscribers sign in with their email, and Supporting Members get larger daily budgets.

I previewed it in [Weekly Thing 346](https://weekly.thingelstad.com/archive/346/) and launched it with the [new Weekly Thing website](https://www.thingelstad.com/2026/05/07/massive-weekly-thing-website-build.html) on May 7, 2026. A month later, [Thingy Evolved](https://www.thingelstad.com/2026/06/07/thingy-evolved.html) gave it its own site and three archives to search, the newsletter, the blog, and the podcast, along with saved conversations, curiosity maps, voice input, and memory. In September I added photos and shared conversations and was ready to [call it complete](https://www.thingelstad.com/2026/09/03/im-ready-to-call-thingy.html). In October it got [a new design](https://www.thingelstad.com/2026/10/07/thingy-my-digital-librarian-got.html), with Claude Sonnet for subscribers and Claude Opus for Supporting Members.

Behind Thingy is Librarian, a private archive API with no front end of its own. It holds working copies of every Weekly Thing issue, the blog posts pulled from Micro.blog, and the Another Thing episodes with their transcripts, and it builds the search indexes Thingy answers from. Its [repository](https://github.com/jthingelstad/librarian-thing) began as Studio, my earlier publishing system. When publishing moved to WT Builder, what was left became Librarian. It also indexes this registry of things I have built.

The same tools Thingy uses are offered as an MCP server at `librarian.thingelstad.com/mcp`. Weekly Thing subscribers can [connect Claude, ChatGPT, or another AI](https://thingy.thingelstad.com/connect/) to it and sign in with their email, with no password. The AI can then search the newsletter, blog, links, photos, and podcast, and link back to each source it uses. As described on [Thingy’s about page](https://thingy.thingelstad.com/about/), an AI agent spent eight review rounds trying to break the tools when the MCP server launched, and what it found shaped how matching works.

Since [Weekly Thing 350](https://weekly.thingelstad.com/archive/350/), Thingy also writes two sections of each issue: Supporting Membership and Echoes, which connects the week’s topics to earlier issues.
