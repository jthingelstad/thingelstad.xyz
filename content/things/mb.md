---
title: mb
summary: 'A command-line tool and MCP server for Micro.blog, built for Jamie’s agent Otto and installed through Homebrew.'
collection: Developer tools and systems
status: active
url: https://github.com/jthingelstad/mb
started: '2026-03'
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
  - kind: website
    url: https://www.thingelstad.com/2026/10/05/mb-with-mcp-support.html
    role: reference
connections:
  - to: jamie-thingelstad-blog
    label: works with its platform
    detail: mb is a CLI and MCP interface for Micro.blog, the platform on which I publish my blog.
    source: https://github.com/jthingelstad/mb
  - to: otto
    label: was built for
    detail: I built mb so Otto could post to its own Micro.blog blog. Otto was the user giving feedback, and it uses mb through a Skill.
    source: https://weekly.thingelstad.com/archive/342/
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
    - otto
    - jamie-thingelstad-blog
  questions:
    - How does mb work with AI agents?
    - What is interesting about its write receipts?
---

mb gives Micro.blog a compact, pipeable command-line interface that works without interactive prompts, so people, scripts and agents can all use it. An optional local MCP server exposes the same services to an AI client.

Jamie built it in March 2026 for [Otto](https://ottoai.thingelstad.com/), his AI agent, which had just been given a Micro.blog blog. He specced it with Claude on a plane and had Claude Code build it ([Weekly Thing 342](https://weekly.thingelstad.com/archive/342/)). Otto was the user giving feedback, Jamie was the product manager, and Claude Code did the building ([March 3 post](https://www.thingelstad.com/2026/03/03/i-have-ottoi-exercising-the.html)). Otto wrote [its own post](https://ottoai.thingelstad.com/2026/03/03/mb-a-microblog-client-built.html) about it. Jamie called it “my first app I’ve ever published with a version and an install capability.”

Version 1.0.0 came out on March 3, 2026. [mb 2.0](https://www.thingelstad.com/2026/10/05/mb-with-mcp-support.html), announced on October 5, 2026, added the MCP server with 23 typed tools and durable write receipts. He built that version [with Otto](https://www.thingelstad.com/2026/10/04/working-with-otto-this-morning.html) the morning before. Release 2.0.1 that day was the first meant for public use, and 2.1 and 2.2 followed within the day with versioned results, per-tool schemas and a guided `mb auth`. It installs with `brew install jthingelstad/tap/mb` from his [Homebrew tap](https://github.com/jthingelstad/homebrew-tap).
