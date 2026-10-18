---
title: Escaping Things
summary: The Thingelstad family’s escape room team log, with every room played since 2016, on a map with trips, players, and stats.
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

Escaping Things is the escape room team of Jamie, Tammy, Mazie, and Tyler, and [escape.thingelstad.com](https://escape.thingelstad.com/) is its log: every room the family has played, with results, photos, ratings, a map, trips, players, and stats. By August 2026 it recorded 113 rooms in 11 countries.

The record began as a [list on Jamie’s blog](https://www.thingelstad.com/lists/escape-rooms/), built from posts about rooms. In March 2025 he [reconciled it](https://www.thingelstad.com/2025/03/16/reconciled-list-of-escape-rooms.html) against blog posts, photos, YNAB transactions, and calendars, and the count went from 43 rooms to 65. With a spring 2026 trip to Amsterdam, Paris, and Barcelona planned around TERPECA-ranked rooms, he wanted a dedicated site with a map. As he told it in [Weekly Thing 342](https://weekly.thingelstad.com/archive/342/), he turned his spreadsheet into a CSV, wrote a CLAUDE.md with Claude, and had Claude Code build the site. He then moved the data into an Airtable base of companies, locations, and rooms, and [announced the site](https://www.thingelstad.com/2026/02/23/ive-been-working-on-this.html) on 2026-02-23. He never looked at its code; Codex and Claude Code wrote it.

After the twelve rooms of that trip, Jamie added trip pages, starting with [Escape in Europe](https://escape.thingelstad.com/trip/escape-in-europe/), with commentary from the whole family ([WT344](https://weekly.thingelstad.com/archive/344/)). The site is a static Eleventy build from Airtable snapshots, with Leaflet maps, Chart.js stats, Pagefind search, and an Atom feed of new rooms.
