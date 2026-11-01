---
title: Oliver
summary: 'The R/W Book Club’s AI agent and sixth member. Oliver keeps the club’s record, briefs its meetings and publishes the website.'
collection: Games and communities
status: active
url: https://rwbookclub.com/oliver/
started: '2026-05'
topics:
  - agents
  - reading
sources:
  - kind: github
    repository: jthingelstad/rwbookclub.com
    role: implementation
    path: agent
  - kind: website
    url: https://rwbookclub.com/oliver/
    role: reference
connections:
  - to: r-w-book-club
    label: publishes the website of
    detail: Every book, meeting and member is kept in Oliver’s database, and Oliver rebuilds and publishes the club website to GitHub Pages.
    source: https://rwbookclub.com/about/
---

Oliver is the [R/W Book Club](https://rwbookclub.com/)’s agent: “archivist, correspondent, meeting-runner, picking partner, and — by the club’s own vote, years before he could hear it — our sixth member” ([Oliver](https://rwbookclub.com/oliver/)). He keeps every book, meeting, member, review and rating since 2003 in his database, and he generates and deploys the club’s website from it.

Two days before each meeting Oliver sends a researched discussion brief the club calls the Preface, and a week after he sends a Postscript with news about books the club has read. He helps the members pick the next book, runs roll call and reminders over email and Discord, keeps a weekly memory of what each member likes, seeded from ten years of the club’s mailing list, and announces his own releases.

Jamie built Oliver in Python on the Anthropic API, inside the club’s [public repository](https://github.com/jthingelstad/rwbookclub.com), which became a monorepo of website, corpus and [Oliver](https://github.com/jthingelstad/rwbookclub.com/commit/bdb72521adb776b3a9897f1ae3c0f0f41c62ccfb) on May 27, 2026. He is named for Oliver Selfridge, whose 1958 paper “Pandemonium: A Paradigm for Learning” introduced the demon/agent metaphor ([SOUL.md](https://github.com/jthingelstad/rwbookclub.com/blob/main/agent/docs/SOUL.md)).

Why a book club has an agent, in Jamie’s words:

> everybody in our book club is technically minded, and interested in exploring technology. And I had been sharing with them the work that I had done to build Otto, the work I was doing to build Thingy, what I was doing with the agent to power my Clash Royale clan, and they were all very curious about what an agent could do.
>
> [Jamie, question 20](https://thingelstad.xyz/interviews/jamie-october-2026/#q20)

The experiment has a next step: [“at some point, we may actually let Oliver pick a book”](https://thingelstad.xyz/interviews/jamie-october-2026/#q20).
