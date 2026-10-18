---
title: Oliver
summary: The R/W Book Club’s AI agent and sixth member, which keeps the club’s record, briefs meetings and publishes its website.
collection: Games and communities
status: active
url: https://rwbookclub.com/oliver/
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

Oliver is the [R/W Book Club](https://rwbookclub.com/)’s agent: “archivist, correspondent, meeting-runner, picking partner, and — by the club’s own vote, years before he could hear it — our sixth member” ([Oliver](https://rwbookclub.com/oliver/)). He keeps every book, meeting, member, review and rating since 2003 in his database and generates and deploys the club’s website from it.

Two days before each meeting Oliver sends a researched discussion brief, the Preface, and a week after it a Postscript on news about books the club has read. He helps members pick the next book, runs roll call and reminders over email and Discord, keeps a weekly memory of members’ tastes seeded from ten years of the club’s mailing list, and announces his own releases.

Jamie built Oliver in Python on the Anthropic API, as part of the club’s [public repository](https://github.com/jthingelstad/rwbookclub.com). He is named for Oliver Selfridge, whose 1958 paper “Pandemonium: A Paradigm for Learning” introduced the demon/agent metaphor ([SOUL.md](https://github.com/jthingelstad/rwbookclub.com/blob/main/agent/docs/SOUL.md)).
