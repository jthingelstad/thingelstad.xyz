---
title: Release Notes
summary: 'A daily email with today’s version number. Reply with notes from your day and they become that version’s release notes.'
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
bundles:
  - id: 'icon-studies'
    title: 'A folded v and a dot'
    caption: 'The Release Notes direction from the October 31, 2026 design session with Codex: an ivory paper fold and a tangerine period on cobalt. An open journal was explored and set aside. Changelog received a separate mark made of three stacked versions.'
  - id: 'favicon-studies'
    title: 'The mark in a browser tab'
    caption: 'Two simplified versions of the same mark, checked at 16 and 32 pixels. Flat was the recommendation for browser tabs; the full paper fold remained the PWA icon direction. The download keeps the original artwork, prompts and small-size previews.'
artifacts:
  - file: 'icon-folded-v-2026-10-31.png'
    bundle: 'icon-studies'
    title: 'The single folded v'
    caption: 'Ivory paper and a tangerine period on cobalt. The first concept was proposed for Changelog before Jamie assigned it to Release Notes.'
    date: '2026-10-31'
  - file: 'icon-open-journal-2026-10-31.png'
    bundle: 'icon-studies'
    title: 'The open journal, set aside'
    caption: 'A cobalt open book with a tangerine bookmark on cream. This direction was not selected.'
    date: '2026-10-31'
  - file: 'favicon-flat-2026-10-31.png'
    bundle: 'favicon-studies'
    title: 'Flat'
    caption: 'The v and period with a broader silhouette and simplified curl. This was the recommended browser-tab direction in the study.'
    date: '2026-10-31'
  - file: 'favicon-micro-fold-2026-10-31.png'
    bundle: 'favicon-studies'
    title: 'Micro Fold'
    caption: 'A reduced curl and a small number of fold tones, preserving more of the paper treatment at browser-tab sizes.'
    date: '2026-10-31'
  - file: 'icon-design-files-2026-11-01.zip'
    bundle: 'favicon-studies'
    title: 'The icon design files'
    caption: 'Full-size PNG studies, small-size previews, the design record and generation prompts.'
    date: '2026-11-01'
    preview: 'icon-design-files-preview-2026-11-01.png'
---

Release Notes is a daily email from Your Version Number. Each morning it tells you today’s number (“You’re 5.4.278 today”). Reply with anything about your day, or write it in the web app, and it is kept as the release notes for that version. Jamie [introduced it on October 8, 2026](https://www.thingelstad.com/2026/10/08/in-i-wrote-about-your.html). After making the Your Version Number site he wished he got his version by email, and then wondered what it would be like to add notes to each version. So he built it. The longer version, from the interview:

> I just wanted to get an email every day that had my version number. Which, by the way, stems back to something I had Otto doing in Discord. Otto every day was writing into a channel with a reflection a daily reflection and my version number. And I thought, you know, I’d rather have this landing in my email. … What if I just replied to that and that was a form of kind of micro journaling, a way of just very lightweight journaling.
>
> [Jamie, question 19](https://thingelstad.xyz/interviews/jamie-october-2026/#q19)

It is lightweight journaling built around the reply. In [Weekly Thing 353](https://weekly.thingelstad.com/archive/353/) he wrote that he enjoyed getting the email each day and simply replying with notes, photos, and even audio. The [README](https://github.com/jthingelstad/yvn-release-notes) has the rest: a writing streak and “On this day” notes from earlier releases right in the email, tags and search, weather and places kept with each day, a Day One import, a full zip export, opt-in transcripts and photo descriptions, and owner-approved access for agents through MCP. The email tracks nothing and loads nothing remote. He sets it beside the blog: [“if I have a private journal with Release Notes, I have a public journal with my blog”](https://thingelstad.xyz/interviews/jamie-october-2026/#q25).

It runs on AWS: a scheduled sender, SES for inbound replies, DynamoDB for notes, and a React web app with Hono functions on Lambda behind CloudFront. The version arithmetic is a port of the Your Version Number site’s own code, checked against thousands of generated cases. Opening it to other people took little, he said: [“The reality was that I did all the work. So I had all of the authentication there.”](https://thingelstad.xyz/interviews/jamie-october-2026/#q19) [“And so the effort of opening it up to other users was really small. And I intentionally then gated it on Weekly Thing members so that it didn’t kind of grow out of control”](https://thingelstad.xyz/interviews/jamie-october-2026/#q19).

The [icon studies](#artifacts-icon-studies) made with Codex on October 31, 2026 paired Release Notes with its iPhone companion, [Changelog](/things/changelog/#artifacts-icon-studies). Release Notes kept a single folded ivory v and a tangerine period on cobalt; Changelog’s selected direction stacks three versions of the fold. A literal open journal was set aside. The [favicon studies](#artifacts-favicon-studies) reduce the same v and dot for a browser tab, with Flat and Micro Fold compared against the full paper sculpture at 16 and 32 pixels. These artifacts preserve the design exercise.
