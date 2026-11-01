---
title: Escaping Things
summary: 'The escape room log of Jamie’s family team, with every room played since 2016, on a map with trips, players, and stats.'
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

Escaping Things is the escape room team of Tammy, Mazie, Tyler, and Jamie, and [escape.thingelstad.com](https://escape.thingelstad.com/) is their log: every room they have played, with results, photos, ratings, a map, trips, players, and stats. By August 2026 it recorded 113 rooms in 11 countries.

The record began as a [list on Jamie’s blog](https://www.thingelstad.com/lists/escape-rooms/), built from posts about rooms. In March 2025 he [reconciled it](https://www.thingelstad.com/2025/03/16/reconciled-list-of-escape-rooms.html) against blog posts, photos, YNAB transactions, and calendars, and the count went from 43 rooms to 65. With a spring 2026 trip to Amsterdam, Paris, and Barcelona planned around TERPECA-ranked rooms, he wanted a real site with a map. As he told it in [Weekly Thing 342](https://weekly.thingelstad.com/archive/342/), he turned his spreadsheet into a CSV, wrote a CLAUDE.md with Claude, and had Claude Code build the site. Then he moved the data into an Airtable base of companies, locations, and rooms, and [announced the site](https://www.thingelstad.com/2026/02/23/ive-been-working-on-this.html) on February 23, 2026. Codex and Claude Code wrote all of its code.

Why a team of puzzle players has a website, in his words:

> We don’t need a website, but we wanted a website, or I wanted to have a website. And part of this is, you know, you’ll you can tell that I I like to document things. I like to collect things. I like to create kind of databases of things.
>
> [Jamie, question 24](https://thingelstad.xyz/interviews/jamie-october-2026/#q24)

Two things make this team’s log different, he said: [“we intentionally build escape rooms into travel”](https://thingelstad.xyz/interviews/jamie-october-2026/#q24), and they [“seek out rooms that are on the kind of highest rated rooms in the world”](https://thingelstad.xyz/interviews/jamie-october-2026/#q24). The site is there [“to share it with people and to record it for our own family posterity”](https://thingelstad.xyz/interviews/jamie-october-2026/#q24).

Tammy found the trip’s rooms (“Tammy found us twelve amazing escape rooms”), and the whole family writes up the rooms they play ([Escape in Europe, Day 13](https://www.thingelstad.com/2026/03/27/escape-in-europe-day.html)). After the twelve rooms of that trip, Jamie added trip pages, starting with [Escape in Europe](https://escape.thingelstad.com/trip/escape-in-europe/), with commentary from all four of them ([Weekly Thing 344](https://weekly.thingelstad.com/archive/344/)). The site is a static Eleventy build from Airtable snapshots, with Leaflet maps, Chart.js stats, Pagefind search, and an Atom feed of new rooms.
