---
title: mb
summary: Micro.blog from the command line.
collection: Developer tools and systems
status: active
url: https://github.com/jthingelstad/mb
topics:
  - agents
  - mcp
  - open-web
sources:
  - kind: github
    repository: jthingelstad/mb
    role: implementation
  - kind: github
    repository: jthingelstad/homebrew-tap
    role: distribution
connections:
  - to: jamie-thingelstad-blog
    label: works with its platform
    detail: mb is a CLI and MCP interface for Micro.blog, the platform on which Jamie publishes his blog.
    source: https://github.com/jthingelstad/mb
story:
  color: '#24272d'
  introduction: An open-web tool built for people, scripts, and agents.
  engineering:
    - The CLI and MCP tools share the same service layer.
    - Write operations return durable receipts so an uncertain result can be checked before a request is sent again.
    - An optional MCP server exposes 23 typed tools. Homebrew provides a distribution path.
  stack:
    - Python
    - CLI
    - MCP
    - Micro.blog
  source: https://github.com/jthingelstad/mb
  related:
    - mb-audit
    - weekly-thing
  questions:
    - How does mb work with AI agents?
    - What is interesting about its write receipts?
---

Give Micro.blog a compact, pipeable command-line interface that works without interactive prompts. The same services can be exposed to an AI client through a local MCP server.

It installs from Jamie's [Homebrew tap](https://github.com/jthingelstad/homebrew-tap).
