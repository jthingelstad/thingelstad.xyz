---
title: llms.txt for Micro.blog
summary: A Micro.blog plug-in that publishes /llms.txt and /llms-full.txt so AI agents can read a hosted blog.
collection: Developer tools and systems
status: active
url: https://github.com/jthingelstad/mb-llms-txt
started: '2026-05-02'
topics:
  - agents
  - open-web
sources:
  - kind: github
    repository: jthingelstad/mb-llms-txt
    role: implementation
connections:
  - to: road-sign-math
    label: is installed on
    detail: Road Sign Math’s Micro.blog site at roadsignmath.xyz was the live install used to test the plug-in and serves the llms.txt it generates.
    source: https://github.com/jthingelstad/mb-llms-txt/blob/main/AGENTS.md
---

A Micro.blog plug-in that adds the [llmstxt.org](https://llmstxt.org/) standard to any blog hosted on Micro.blog. Once installed it publishes `/llms.txt`, a Markdown index of the blog with its title, description, recent posts and an optional year-by-year archive, and `/llms-full.txt`, the full text of the most recent posts in one file. Five settings in the Micro.blog plug-in screen control the intro, the number of posts in each file, and whether pages and the full archive are included, so the same plug-in works for a blog of a few dozen posts or one of 20 years and 18,000 posts.

Jamie built it on May 2, 2026, following the patterns of Micro.blog’s own plug-ins. The first versions also tried to give every post a Markdown twin, as the spec recommends. On a live install that template replaced the theme on every post page, so version 1.0.2 removed the feature. The [roadmap](https://github.com/jthingelstad/mb-llms-txt/blob/main/ROADMAP.md) records the platform changes Micro.blog would need before per-post Markdown and per-year files can return. [Road Sign Math](https://www.roadsignmath.xyz/llms.txt) serves the plug-in’s output.
