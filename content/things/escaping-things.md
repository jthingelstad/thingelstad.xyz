---
title: Escaping Things
summary: My family’s escape room team log, with every room played since 2016, on a map with trips, players, and stats.
collection: Games and communities
status: active
url: https://escape.thingelstad.com/
started: '2026-02-23'
topics:
  - play
sources:
  - kind: github
    repository: jthingelstad/escape.thingelstad.com
    role: implementation
  - kind: website
    url: https://escape.thingelstad.com/
    role: website
    sitemap: https://escape.thingelstad.com/sitemap.xml
    feed: https://escape.thingelstad.com/feed.xml
  - kind: website
    url: https://weekly.thingelstad.com/archive/342/
    role: reference
  - kind: website
    url: https://www.thingelstad.com/lists/escape-rooms/
    role: reference
connections: []
---

Escaping Things is the escape room team of Tammy, Mazie, Tyler, and me, and [escape.thingelstad.com](https://escape.thingelstad.com/) is its log: every room we have played, with results, photos, ratings, a map, trips, players, and stats. By August 2026 it recorded 113 rooms in 11 countries.

The record began as a [list on my blog](https://www.thingelstad.com/lists/escape-rooms/), built from posts about rooms. In March 2025 I [reconciled it](https://www.thingelstad.com/2025/03/16/reconciled-list-of-escape-rooms.html) against blog posts, photos, YNAB transactions, and calendars, and the count went from 43 rooms to 65. With a spring 2026 trip to Amsterdam, Paris, and Barcelona planned around TERPECA-ranked rooms, I wanted a dedicated site with a map. As I told it in [Weekly Thing 342](https://weekly.thingelstad.com/archive/342/), I turned my spreadsheet into a CSV, wrote a CLAUDE.md with Claude, and had Claude Code build the site. I then moved the data into an Airtable base of companies, locations, and rooms, and [announced the site](https://www.thingelstad.com/2026/02/23/ive-been-working-on-this.html) on 2026-02-23. I never looked at its code; Codex and Claude Code wrote it.

Tammy found the trip’s rooms (“Tammy found us twelve amazing escape rooms”), and the whole family writes up the rooms we play ([Escape in Europe, Day 13](https://www.thingelstad.com/2026/03/27/escape-in-europe-day.html)). After the twelve rooms of that trip, I added trip pages, starting with [Escape in Europe](https://escape.thingelstad.com/trip/escape-in-europe/), with commentary from the whole family ([WT344](https://weekly.thingelstad.com/archive/344/)). The site is a static Eleventy build from Airtable snapshots, with Leaflet maps, Chart.js stats, Pagefind search, and an Atom feed of new rooms.
