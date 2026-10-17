---
title: R/W Book Club
summary: A shared archive of the Read / Write Book Club’s reading.
collection: Games and communities
status: active
url: https://rwbookclub.com/
topics:
  - reading
sources:
  - kind: github
    repository: jthingelstad/rwbookclub.com
    role: implementation
  - kind: website
    url: https://rwbookclub.com/
    role: website
    sitemap: https://rwbookclub.com/sitemap.xml
    feed: https://rwbookclub.com/feed.xml
connections:
  - to: oliver
    label: includes
    detail: Oliver is the book club’s Discord agent and member application, sharing the same club database and corpus.
    source: https://rwbookclub.com/
story:
  color: '#507b68'
  introduction: A long-running reading group, with a shared record.
  engineering:
    - The website presents the club’s reading history and members’ commentary.
    - Public llms.txt and llms-full.txt files make the reading record accessible to agents for analysis.
    - An iCal feed lets members subscribe to the meeting calendar.
    - Earlier approaches included MediaWiki and a shared Airtable database.
  stack:
    - Static web
    - LLM context files
    - iCalendar
  source: https://rwbookclub.com/llms.txt
  sourceLabel: Reading history for agents
  related: []
  questions:
    - How can an agent explore the club’s reading history?
    - How has the book club website evolved?
---

R/W stands for Read / Write Book Club. The club was started by Jamie’s professor, Dr. John Riedl; Jamie joined when the group was replacing a member. Jamie built the website, not the club.

The members have been meeting for many years, reading mostly nonfiction across a variety of subjects. The website documents the books they have read and provides a shared place for members’ commentary.

The group’s reading record has taken several forms, including a MediaWiki site and an Airtable database used across the club. The current website makes that history accessible to both people and agents: LLM context files provide an easily parsed reading record, and an iCal feed puts meetings on members’ calendars. The website shares an interest in reading with Jamie’s Reading Things newsletter.
