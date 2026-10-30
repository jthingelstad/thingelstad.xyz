---
title: Road Sign Math
summary: A game of finding road signs whose numbers form an equation, begun as a blog in 2005, rebooted as a wiki in 2011 and as a blog again in 2023.
collection: Games and communities
status: active
url: https://www.roadsignmath.xyz/
started: '2005-02-13'
topics:
  - mediawiki
  - play
  - archives
sources:
  - kind: website
    url: https://www.roadsignmath.xyz/
    role: website
    sitemap: https://www.roadsignmath.xyz/sitemap.xml
    feed: https://www.roadsignmath.xyz/feed.xml
  - kind: website
    url: https://www.thingelstad.com/2023/10/21/road-sign-math.html
    role: reference
  - kind: website
    url: https://www.thingelstad.com/projects/road-sign-math/
    role: reference
  - kind: github
    repository: jthingelstad/rsm.thingelstad.com
    role: historical
connections: []
story:
  color: '#287454'
  introduction: A little mathematics. A lot of looking around.
  engineering:
    - The original site, launched in 2005, had rules for play, a scoring system and scoreboards for players and states.
    - In 2011 it moved from a blog to a wiki so players could submit and maintain their own signs.
    - The 2023 reboot is a simple blog on Micro.blog that typesets each sign’s equation with MathJax.
  stack:
    - Micro.blog
    - MathJax
    - MediaWiki
  source: https://www.roadsignmath.xyz/
  sourceLabel: See the signs
  related:
    - planet-kubb
    - open-loop
  started: Played since 2005
  questions:
    - How did Road Sign Math start?
    - Why was Road Sign Math rebooted instead of relaunched?
bundles:
  - id: archive
    title: The first site, rebuilt
    caption: In October 2026 I rebuilt the first site, 2005 to 2014, from a 2016 MediaWiki backup, with photos recovered from the one-year anniversary poster, the Internet Archive, an old backup drive and copies I had kept. Of its 251 signs, 157 have a photo again.
  - id: my-signs
    title: My signs
    caption: Photos of the signs I found myself, from the first site.
artifacts:
  - file: map-2005-2014.png
    bundle: archive
    title: Every sign, 2005 to 2014
    caption: All 251 signs, mine in yellow and other players’ in blue. 240 are in 44 states and Washington, D.C., none from Indiana, Kansas, Maine, Nevada, Oklahoma or Tennessee, and 11 are in eight other countries, one of them in the Serengeti.
    date: '2026-10-30'
  - file: signs-2005-2014.csv
    bundle: archive
    title: The signs, as data
    caption: 'One row per sign: its number on the old site, the day it was posted, its title and type, the numbers on it, the math as the site typeset it (TeX), where it is, whether a photo survives, and whether I found it. Taken out: the other players’ names, including one sign titled with its finder’s user name.'
    date: '2026-10-30'
  - file: genesis-2005-03-07.jpg
    bundle: my-signs
    title: Genesis
    caption: The sign that started it, on I-94 near Melrose, Minnesota, heading east toward the Twin Cities. Melrose 3, St Cloud 33, Minneapolis 99, and 3 × 33 = 99. The full-size frame from my Canon PowerShot G3, found on an old backup drive in 2026; the site only ever showed a small copy.
    date: '2005-03-07'
  - file: my-signs-2005-2012.jpg
    bundle: my-signs
    title: My signs, 2005 to 2012
    caption: The 23 signs I found for the first site whose photos survive, with the day I posted each one. Most are cut from the one-year anniversary poster and are as sharp as the site showed them.
    date: '2026-10-30'
---

Road Sign Math is a driving game: find a road sign whose numbers make a valid equation, photograph it, and share it. It began with a sign on I-94 East toward the Twin Cities that I passed coming home from visiting family in North Dakota, which listed distances of 3, 33 and 99 miles: 3 times 33 equals 99. On [Open Loop #1](https://www.thingelstad.com/projects/open-loop/1-big-fuzzy-dead-cat/) I recalled that my friend Jim told me I should make a website, “and so that day I did a website.”

I [launched the site](https://www.thingelstad.com/2010/02/13/010000.html) on February 13, 2005, as a blog of signs on .Text, moved it to [WordPress](https://www.thingelstad.com/2007/08/17/t212185032.html) in August 2007, and as other people sent in their own it gained rules, a scoring system and scoreboards for players and states. Signs came from all 50 states and most continents, including one from the Serengeti; by 2012 there were over 200. In 2011 I rebooted it for the first time, as a wiki, so players could maintain their own signs; an iOS app for capturing signs was considered but never built. In 2016, during a round of [technical downsizing](https://www.thingelstad.com/2016/05/03/technical-downsizing.html), I shut the site down and let roadsignmath.com expire ([Road Sign Math Rebooted](https://www.thingelstad.com/2023/10/21/road-sign-math.html)).

In 2017 I started a Jekyll site for the signs, [rsm.thingelstad.com](https://github.com/jthingelstad/rsm.thingelstad.com), on a stock theme. Two spin-offs, Road Sign Wordplay and Road Sign Bingo, never got going, and I [shut both down](https://www.thingelstad.com/2012/02/08/shutting-down-some.html) in February 2012 with other “ideas that I set up and then never took anywhere.” In March 2021 a sign Tammy found near Phoenix gave Road Sign Math “a breath of new life” at roadsignmath.thingelstad.com ([Weekly Thing 177](https://weekly.thingelstad.com/archive/177/)), and that summer we found ten more on a [Vermont road trip](https://www.thingelstad.com/2021/08/15/varmont-road-trip.html). I registered roadsignmath.xyz in 2021, and in October 2023 I [rebooted](https://www.thingelstad.com/2023/10/21/road-sign-math.html) Road Sign Math a second time, back to a simple blog: “Just my signs. No scoring system or leaderboards.” New signs still appear, such as one in [September 2025](https://www.thingelstad.com/2025/09/01/it-always-makes-me-smile.html).

In October 2026 I rebuilt the first site from a 2016 MediaWiki backup: 251 signs found by 40 players from 2005 to 2014, with photos for 157 of them recovered from the one-year anniversary poster, the Internet Archive, an old backup drive and copies I had kept.
