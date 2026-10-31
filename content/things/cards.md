---
title: Cards
summary: The share image for pages on my sites, a 1200 by 630 card drawn from the page itself and made on demand at cards.thingelstad.com.
collection: Publishing
status: active
url: https://github.com/jthingelstad/cards.thingelstad.com
started: '2026-10-24'
topics:
  - open-web
sources:
  - kind: github
    repository: jthingelstad/cards.thingelstad.com
    role: implementation
connections:
  - to: jamie-thingelstad-blog
    label: draws the share cards for
    detail: Every blog post has shared its own card since October 24, 2026, when Thing Hugo 2.0.19 pointed each post’s share image at cards.thingelstad.com.
    source: https://github.com/jthingelstad/thing-hugo/commit/ecb83ccab3cce43601b16c489f04689787496a41
  - to: weekly-thing
    label: draws the share cards for
    detail: Since October 25, 2026, every issue shares a card on its cover photo, with its summary and its count of links and journal entries, and the front page shares the newest issue’s card.
    source: https://github.com/jthingelstad/weekly.thingelstad.com/pull/28
  - to: another-thing
    label: draws the share cards for
    detail: Since October 25, 2026, every episode shares a card with its number, date, summary, and running time.
    source: https://github.com/jthingelstad/another.thingelstad.com/pull/6
  - to: linking-things
    label: draws the share cards for
    detail: Since October 25, 2026, each saved link’s page shares a card with its title, its site, the day I saved it, the Weekly Thing issues that carried it, and my note when the note is my own.
    source: https://github.com/jthingelstad/links.thingelstad.xyz/pull/21
artifacts:
  - file: red-leaves.jpg
    title: A blog post over its photo
    caption: A short post with a wide photo sets its words in white over the photo, the way an issue sits on its cover.
    date: '2026-10-25'
    source: https://www.thingelstad.com/2026/10/24/red-leaves.html
  - file: weekly-thing-353.jpg
    title: A Weekly Thing issue
    caption: Weekly Thing 353 on its cover photo, with the issue’s summary and its count of links and journal entries.
    date: '2026-10-25'
    source: https://weekly.thingelstad.com/archive/353/
  - file: another-thing-episode.png
    title: An Another Thing episode
    caption: The first episode, with its number, date, summary, and running time.
    date: '2026-10-25'
    source: https://another.thingelstad.com/2025/10/05/how-do-you-start-a.html
  - file: linking-things-link.png
    title: A saved link
    caption: A link on Linking Things with its site, the day I saved it, the issue that carried it, and my note.
    date: '2026-10-25'
    source: https://links.thingelstad.xyz/links/dec34be50cef/
---

Cards makes the share image for pages on my sites: the 1200 by 630 picture that appears when a link is shared on Mastodon, Bluesky, Slack, or iMessage. Each card is drawn from the page itself. A blog post shows its title or opening words, its date and categories, and its first photo, and a short post with a wide photo sets its words over the photo. A Weekly Thing issue sits on its cover photo with its summary and its count of links and journal entries. An Another Thing episode shows its number and running time. A saved link on Linking Things shows its title, its site, and the issues that carried it, with my note when the note is mine.

I built it with coding agents on October 24, 2026, after deciding against Micro.blog’s own card styles. I wanted the full canvas, no photo of me, and the blog’s type in black and white. Now every page on my sites shows up well when someone shares it, which is a small thing that makes me happy every time I see it. The blog came first, that same day. Weekly Thing, Another Thing, and Linking Things followed on October 25, each with a card of its own.

Each page names its card in its share-image tag, with a short hash of what the card shows, so an edited page gets a new card. The first request for a card runs a Lambda function that reads the page, lays the card out with Satori, and renders it with resvg; CloudFront then keeps it for a year. It draws only the card a page actually names, so it cannot be used to make any other image. Cards with a photo are JPEG, to stay under Bluesky’s 1 MB limit, and emoji are drawn from Twemoji.
