---
title: mb-audit
summary: A Python command-line tool that checks a live Micro.blog site against its BAR backup files and reports what has gone missing.
collection: Developer tools and systems
status: active
url: https://github.com/jthingelstad/mb-audit
started: '2026-05'
topics:
  - open-web
sources:
  - kind: github
    repository: jthingelstad/mb-audit
    role: implementation
  - kind: website
    url: https://weekly.thingelstad.com/archive/346/
    role: reference
connections:
  - to: jamie-thingelstad-blog
    label: audits its platform
    detail: mb-audit compares a Micro.blog site with its BAR backups to check that the published content remains intact.
    source: https://github.com/jthingelstad/mb-audit
  - to: mb
    label: is a sibling of
    detail: Both are Micro.blog command-line tools Jamie had Claude Code build in 2026, mb for posting and managing a blog, mb-audit for checking a site against its backups.
    source: https://weekly.thingelstad.com/archive/346/
---

mb-audit audits a Micro.blog site against one or more BAR backup files, the archives Micro.blog exports. The backup is treated as the source of truth, and the live site is checked to make sure it still contains everything the backup says it should. Commands inspect a backup, verify and diff a site against it, and write a report; repair through Micropub is opt-in.

Jamie had Claude Code build it in May 2026, the day after Vincent added llms.txt support to the Micro.blog developer documentation at Jamie’s suggestion. It used that endpoint “to build a thing I have wanted to exist for micro.blog for a while” ([Weekly Thing 346](https://weekly.thingelstad.com/archive/346/)).
