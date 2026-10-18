---
title: Librarian
summary: The API and MCP server behind Thingy that searches and cites Jamie’s newsletter, blog, and podcast archive.
collection: Publishing
status: active
url: https://thingy.thingelstad.com/connect/
started: '2026-04-26'
topics:
  - agents
  - mcp
  - open-web
  - archives
sources:
  - kind: github
    repository: jthingelstad/librarian-thing
    role: implementation
  - kind: website
    url: https://librarian.thingelstad.com/mcp
    role: mcp
  - kind: website
    url: https://librarian.thingelstad.com/
    role: website
  - kind: website
    url: https://thingy.thingelstad.com/connect/
    role: reference
connections:
  - to: thingy
    label: powers
    detail: Thingy is the web query surface for the Librarian archive and retrieval API.
    source: https://thingy.thingelstad.com/connect/
  - to: things-ive-built
    label: indexes
    detail: Librarian snapshots the registry’s things.json into its Weekly Thing corpus, so Thingy and MCP clients can answer questions about Jamie’s projects (sources thing-<id> and thing-index).
    source: https://github.com/jthingelstad/librarian-thing/tree/main/data/things
  - to: wt-builder
    label: receives issues from
    detail: After each issue publishes, WT Builder commits the issue text into the Librarian repository so Thingy can retrieve and cite it.
    source: https://github.com/jthingelstad/librarian-thing
story:
  color: '#5f7d8c'
  introduction: An archive that answers with its sources.
  engineering:
    - A Python corpus pipeline builds chunked, embedded indexes of every source, and a Node API on AWS Lambda answers from them.
    - Retrieval is hybrid. TF-IDF lexical search and semantic embeddings are fused with reciprocal-rank fusion, then reranked.
    - An agent loop running Claude on Amazon Bedrock plans tool calls, gathers evidence, and writes cited answers.
    - The same tools are published as an MCP server with OAuth 2.1 sign-in, and a suite of more than 850 fixtures runs on every deploy.
  stack:
    - Python
    - Node
    - AWS Lambda
    - Amazon Bedrock
    - MCP
  source: https://thingy.thingelstad.com/about/
  sourceLabel: How Thingy works
  related:
    - thingy
    - weekly-thing
    - jamie-thingelstad-blog
    - another-thing
  questions:
    - How does Librarian find and cite a source?
    - How can I connect my own AI to the archive?
---

Librarian is the archive half of Jamie’s publishing system. It holds working copies of every Weekly Thing issue, the blog posts pulled from Micro.blog, and the Another Thing episodes with their transcripts. It builds search indexes from them and serves them through an API, and Thingy answers from that API. Its [repository](https://github.com/jthingelstad/librarian-thing) began as Studio, Jamie’s earlier publishing system. When publishing moved to WT Builder, what was left became Librarian.

The same tools Thingy uses are offered as an MCP server at `librarian.thingelstad.com/mcp`. Weekly Thing subscribers can [connect Claude, ChatGPT, or another AI](https://thingy.thingelstad.com/connect/) to it and sign in with their email, with no password. The AI can then search the newsletter, blog, links, photos, and podcast, and link back to each source it uses. As described on [Thingy’s about page](https://thingy.thingelstad.com/about/), an AI agent spent eight review rounds trying to break the tools when the MCP server launched, and what it found shaped how matching works. Librarian also indexes this registry of things Jamie has built.
