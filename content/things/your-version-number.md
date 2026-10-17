---
title: Your Version Number
summary: Life, versioned.
collection: Personal tools and making
status: active
url: https://yourversionnumber.com/
topics:
  - play
sources:
  - kind: github
    repository: jthingelstad/yourversionnumber.com
    role: implementation
  - kind: website
    url: https://yourversionnumber.com/
    role: website
    sitemap: https://yourversionnumber.com/sitemap.xml
connections:
  - kind: lineage
    to: release-notes
    label: grew into
    detail: Release Notes uses Your Version Number’s birthday arithmetic in a daily email and personal journal.
    source: https://github.com/jthingelstad/yvn-release-notes
story:
  color: '#1763ff'
  introduction: A different way to count the days.
  engineering:
    - A framework-free static site calculates its numbers in the browser.
    - Dates, people, themes, and signed cards travel in the URL, making a view shareable without an account.
    - The related Release Notes product adds daily email and a personal journal. It has its own server and storage.
  stack:
    - JavaScript
    - CSS
    - Static web
    - URL state
  source: https://github.com/jthingelstad/yourversionnumber.com
  related:
    - release-notes
    - mb
  started: The idea began in 2018
  questions:
    - How does the version number work?
    - How is Release Notes related?
---

Write a birthday the way you would version a piece of software: decades, years into the decade, and days since the last birthday. The same idea has a Work Edition for career milestones.
