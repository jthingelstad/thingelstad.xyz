---
title: WT Builder
summary: The app Jamie uses to write and send the Weekly Thing as a website, an email, and a podcast, and to make Another Thing.
collection: Publishing
status: active
url: https://github.com/jthingelstad/wt-builder
started: '2026-09-20'
topics:
  - open-web
  - agents
  - mcp
sources:
  - kind: github
    repository: jthingelstad/wt-builder
    role: implementation
  - kind: website
    url: https://www.thingelstad.com/2026/09/20/i-just-published-weekly-thing.html
    role: reference
connections:
  - to: weekly-thing
    label: publishes
    detail: WT Builder authors issues and sends the website, email, and audio editions of Weekly Thing.
    source: https://www.thingelstad.com/2026/09/20/i-just-published-weekly-thing.html
  - to: another-thing
    label: authors
    detail: Another Thing podcast authoring moved into WT Builder in October 2026.
    source: https://github.com/jthingelstad/wt-builder/commit/bea76c7ef4fc79a878072feebf694ce18ad217ea
---

WT Builder is the authoring app for the Weekly Thing. Jamie started building it with Claude in July 2026 to replace the Weekly Thing Workshop, the team of Discord agents that had itself taken over in May 2026 from the Shortcuts workflow he had used for nine years. It combines what he writes for an issue with links and posts pulled from Pinboard and Micro.blog. The issue stays structured until it is sent, and then WT Builder renders three different editions: the website, the Buttondown email, and the audio edition for the podcast. The [README](https://github.com/jthingelstad/wt-builder) says it is narrow on purpose: “one editor, one current issue, one newsletter.”

[Weekly Thing 350](https://www.thingelstad.com/2026/09/20/i-just-published-weekly-thing.html), sent on September 20, 2026, was the first issue made in it. Jamie had Claude watch him use it that first time and fix problems as they came up. The next day they [reworked the audio edition](https://www.thingelstad.com/2026/09/21/weekly-thing-podcast-improvements.html), with better pauses, section announcements, and pronunciation, plus links in the episode descriptions. In October Jamie [added an MCP server](https://www.thingelstad.com/2026/10/03/my-newest-mcp-experiment-was.html) so Claude could follow along as he wrote and point out typos and grammar.

On October 11, 2026, WT Builder also [took over the Another Thing podcast](https://github.com/jthingelstad/wt-builder/commit/bea76c7ef4fc79a878072feebf694ce18ad217ea) from the retired Another Thing Builder. The Shortcuts workflow is kept as a fallback.
