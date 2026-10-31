---
title: Release Notes
summary: A daily email with today’s version number. Reply with notes from your day and they become that version’s release notes.
collection: Personal tools and making
status: active
url: https://notes.yourversionnumber.com/
started: '2026-10-08'
topics:
  - play
  - mcp
sources:
  - kind: github
    repository: jthingelstad/yvn-release-notes
    role: implementation
  - kind: website
    url: https://notes.yourversionnumber.com/
    role: website
  - kind: website
    url: https://www.thingelstad.com/2026/10/08/in-i-wrote-about-your.html
    role: reference
  - kind: website
    url: https://weekly.thingelstad.com/archive/353/
    role: reference
connections: []
---

Release Notes is a daily email from Your Version Number. Each morning it tells you today’s number (“You’re 5.4.278 today”). Reply with anything about your day, or write it in the web app, and it is kept as the release notes for that version. I [introduced it on October 8, 2026](https://www.thingelstad.com/2026/10/08/in-i-wrote-about-your.html). After making the Your Version Number site I wished I got my version by email, and then wondered what it would be like to add notes to each version. So I built it.

It is lightweight journaling built around the reply. In [Weekly Thing 353](https://weekly.thingelstad.com/archive/353/) I wrote that I enjoyed getting the email each day and simply replying with notes, photos, and even audio. The [README](https://github.com/jthingelstad/yvn-release-notes) has the rest: a writing streak and “On this day” notes from earlier releases right in the email, tags and search, weather and places kept with each day, a Day One import, a full zip export, opt-in transcripts and photo descriptions, and owner-approved access for agents through MCP. The email tracks nothing and loads nothing remote.

It runs on AWS: a scheduled sender, SES for inbound replies, DynamoDB for notes, and a React web app with Hono functions on Lambda behind CloudFront. The version arithmetic is a port of the Your Version Number site’s own code, checked against thousands of generated cases.
