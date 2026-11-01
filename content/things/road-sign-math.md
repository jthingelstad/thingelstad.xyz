---
title: Road Sign Math (2005)
summary: 'The first Road Sign Math, at roadsignmath.com from 2005 to 2016, where 40 players posted 251 road signs whose numbers make an equation, first on a blog and from 2011 on a wiki.'
collection: Games and communities
status: retired
url: https://web.archive.org/web/20151209013747/http://roadsignmath.com/wiki/Main_Page
started: '2005-02-13'
ended: '2016'
topics:
  - mediawiki
  - play
  - archives
sources:
  - kind: website
    url: https://web.archive.org/web/20151209013747/http://roadsignmath.com/wiki/Main_Page
    role: archive
  - kind: website
    url: https://www.thingelstad.com/2010/02/13/010000.html
    role: reference
  - kind: website
    url: https://www.thingelstad.com/2023/10/21/road-sign-math.html
    role: reference
  - kind: website
    url: https://www.thingelstad.com/projects/road-sign-math/
    role: reference
connections:
  - kind: lineage
    to: road-sign-math-2021
    label: was succeeded by
    detail: Five years after I let roadsignmath.com go, a sign Tammy found near Phoenix brought the game back as a blog of just my family’s signs, with “Just my signs. No scoring system or leaderboards.”
    source: https://www.thingelstad.com/2023/10/21/road-sign-math.html
story:
  color: '#287454'
  introduction: A little mathematics. A lot of looking around.
  engineering:
    - The site launched in 2005 as a blog of signs on .Text and moved to WordPress in 2007. As other people sent in their own signs it gained rules for play, a scoring system and scoreboards for players and states.
    - In 2011 it moved from a blog to a wiki so players could submit and maintain their own signs.
    - In October 2026 I rebuilt it from a 2016 MediaWiki backup, as Markdown with each sign’s math in TeX, and recovered its photos from a poster, the Internet Archive, an old backup drive and copies I had kept.
  stack:
    - .Text
    - WordPress
    - MediaWiki
  source: https://web.archive.org/web/20151209013747/http://roadsignmath.com/wiki/Main_Page
  sourceLabel: See the wiki in the Internet Archive
  related:
    - road-sign-math-2021
    - road-sign-math-2026
    - planet-kubb
    - open-loop
  started: Played since 2005
  questions:
    - How did Road Sign Math start?
    - Why did the first Road Sign Math site move from a blog to a wiki?
    - What happened to the signs players sent in from 2005 to 2014?
bundles:
  - id: archive
    title: The first site, rebuilt
    caption: In October 2026 I rebuilt the first site, 2005 to 2014, from a 2016 MediaWiki backup, with photos recovered from the one-year anniversary poster, the Internet Archive, an old backup drive and copies I had kept. Of its 251 signs, 157 have a photo again.
  - id: my-signs
    title: My signs
    caption: Photos of the signs I found myself, from the first site.
  - id: first-site
    title: From the first site
    caption: The rules, the logos I made, and the poster Jim Bernard and Suzie Meredith made for me as a gift for the site’s first year.
artifacts:
  - file: map-2005-2014.png
    bundle: archive
    title: Every sign, 2005 to 2014
    caption: All 251 signs, mine in yellow and other players’ in blue. 240 are in 44 states and Washington, D.C., none from Indiana, Kansas, Maine, Nevada, Oklahoma or Tennessee, and 11 are in eight other countries, one of them in the Serengeti.
    date: '2026-10-30'
  - file: signs-2005-2014.csv
    bundle: archive
    title: The signs, as data
    caption: 'One row per sign: its number on the old site, the day it was posted, its title and type, the numbers on it, the math as the site typeset it (TeX), where it is, its photos in the ZIP, and who found it.'
    date: '2026-10-30'
  - file: photos-2005-2014.zip
    bundle: archive
    title: Every photo, 2005 to 2014
    caption: All 164 surviving photos of 157 signs, most of them sent in by the players who found the signs, named like the rows of the CSV, by the day the sign was posted and its name. Most are cut from the one-year anniversary poster; the rest come from the Internet Archive, an old backup drive and copies I had kept. Camera details are taken out.
    date: '2026-10-30'
    preview: photos-2005-2014.jpg
  - file: genesis-2005-03-07.jpg
    bundle: my-signs
    title: Genesis
    caption: The sign that started it, on I-94 near Melrose, Minnesota, heading east toward the Twin Cities. Melrose 3, St Cloud 33, Minneapolis 99, and 3 × 33 = 99. The full-size frame from my Canon PowerShot G3, found on an old backup drive in 2026; the site only ever showed a small copy.
    date: '2005-03-07'
  - file: my-signs-2005-2012.jpg
    bundle: my-signs
    title: My signs, 2005 to 2012
    caption: The 24 signs I found for the first site whose photos survive, with the day I posted each one. Most are cut from the one-year anniversary poster and are as sharp as the site showed them.
    date: '2026-10-30'
  - file: rules-3rd-edition-2006.pdf
    bundle: first-site
    title: The rules, 3rd edition
    caption: Revision B, from November 2006, with an example sign for every kind of sign. Typeset in October 2026 from the wiki’s copy, with six plus signs the wiki had lost put back. Two small pictures, a gold star and a pie, are lost.
    date: '2006-11'
    preview: rules-3rd-edition-2006.png
  - file: logo-original.jpg
    bundle: first-site
    title: The original logo
    caption: 'The first site’s logo, which I made: a guide sign that does its own math, 4 × 25 = 100.'
  - file: logo-2011.pdf
    bundle: first-site
    title: The shield logo
    caption: 'The wiki’s logo, which I made: an interstate shield in front of the Genesis sign. The vector original, saved as a PDF on February 21, 2011.'
    date: '2011-02-21'
    preview: logo-2011.png
  - file: poster-2006.jpg
    bundle: first-site
    title: The one-year poster
    caption: Jim Bernard and Suzie Meredith made me this 16 × 20 poster of the first year’s signs as a gift. Most of the photos in this archive were cut from its print file; this copy is half its size.
    date: '2006'
---

Road Sign Math is a driving game: find a road sign whose numbers make a valid equation, photograph it, and share it. It began with a sign on I-94 East toward the Twin Cities that Jamie passed coming home from visiting family in North Dakota, which listed distances of 3, 33 and 99 miles: 3 times 33 equals 99. On [Open Loop #1](https://www.thingelstad.com/projects/open-loop/1-big-fuzzy-dead-cat/) he recalled that his friend Jim told him he should make a website, “and so that day I did a website.” He told it again in the interview:

> I would see this sign. And it was always this sign that said 33399. And to me, it was like just obvious that you should. Go up to the sign, put a time sign and an equal sign, because here’s this sign that was essentially a math equation just sitting right there. And I saw that sign dozens of times and thought, like, that’s so funny. And then I think, like, I wonder how many other signs there are like that.
>
> [Jamie, question 9](https://thingelstad.xyz/interviews/jamie-october-2026/#q9)

He [launched the site](https://www.thingelstad.com/2010/02/13/010000.html) on February 13, 2005, as a blog of signs on .Text, moved it to [WordPress](https://www.thingelstad.com/2007/08/17/t212185032.html) in August 2007, and as other people sent in their own it gained rules, a scoring system and scoreboards for players and states. Signs came from all 50 states and most continents, including one from the Serengeti; by 2012 there were over 200. In 2011 he rebooted it for the first time, as a wiki, so players could maintain their own signs. He thought about an iOS app for capturing signs back then, but never built it. That took another 15 years. Two spin-offs, Road Sign Wordplay and Road Sign Bingo, never got going, and he [shut both down](https://www.thingelstad.com/2012/02/08/shutting-down-some.html) in February 2012 with other “ideas that I set up and then never took anywhere.” In 2016, during a round of [technical downsizing](https://www.thingelstad.com/2016/05/03/technical-downsizing.html), he shut the site down and let roadsignmath.com expire ([Road Sign Math Rebooted](https://www.thingelstad.com/2023/10/21/road-sign-math.html)). In his telling, [“the very first version is almost one of those stories about a rabbit hole that I went down and took a wrong turn. Because I kind of gamified it.”](https://thingelstad.xyz/interviews/jamie-october-2026/#q10) The 2016 shutdown was not a verdict on the game: [“it got swept up in that, not as a specific choice, but in the umbrella of like having fewer things that I was tending to and working on”](https://thingelstad.xyz/interviews/jamie-october-2026/#q10).

The site had an afterlife at work. [“when we were building MarketWatch, we created a cert a capability called live quotes.”](https://thingelstad.xyz/interviews/jamie-october-2026/#q4) [“And that actually started based on what I learned from building the MathJax implementation for Road Sign Math.”](https://thingelstad.xyz/interviews/jamie-october-2026/#q4)

In October 2026 he rebuilt the first site from a 2016 MediaWiki backup: 251 signs found by 40 players from 2005 to 2014, with photos for 157 of them dug out of the one-year anniversary poster, the Internet Archive, an old backup drive and copies he had kept.

The game came back twice: as a blog of his family’s signs from 2021, and in 2026 as an iPhone app with a new roadsignmath.xyz.
