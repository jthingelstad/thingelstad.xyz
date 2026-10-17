---
title: Librarian
summary: Archive retrieval API and MCP server
collection: Publishing
status: active
url: https://librarian.thingelstad.com/mcp
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
    role: website
connections:
  - to: thingy
    label: powers
    detail: Thingy is the web query surface for the Librarian archive and retrieval API.
    source: https://thingy.thingelstad.com/connect/
  - to: things-ive-built
    label: indexes
    detail: Librarian snapshots the registry's things.json into its Weekly Thing corpus, so Thingy and MCP clients can answer questions about Jamie's projects (sources thing-<id> and thing-index).
    source: https://github.com/jthingelstad/librarian-thing/tree/main/data/things
---
