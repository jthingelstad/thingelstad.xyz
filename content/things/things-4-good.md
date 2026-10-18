---
title: Things 4 Good
summary: The Thingelstad family’s yearly sale of hand-poured wooden-wick candles, with every dollar going to four nonprofits they pick.
collection: Personal tools and making
status: active
url: https://things4good.xyz/
started: '2020'
topics:
  - making
sources:
  - kind: github
    repository: jthingelstad/things4good.xyz
    role: implementation
  - kind: website
    url: https://things4good.xyz/
    role: website
    sitemap: https://things4good.xyz/sitemap.xml
  - kind: website
    url: https://www.thingelstad.com/projects/fall-fundraiser/
    role: reference
  - kind: website
    url: https://web.archive.org/web/20201230115619/https://www.thingelstad.com/candles/
    role: reference
  - kind: website
    url: https://www.thingelstad.com/2022/11/27/101105.html
    role: reference
  - kind: website
    url: https://www.thingelstad.com/2025/11/16/things-good-five-year-impact.html
    role: reference
connections: []
story:
  color: '#dda73f'
  introduction: Build something small. Do some good.
  engineering:
    - One event dataset records each sale and its allocations to supported organizations.
    - Totals, charts, and other impact figures are calculated from that shared dataset.
    - An Eleventy build delivers a static site, with small interactive enhancements for exploration.
  stack:
    - Eleventy
    - JavaScript
    - Data-driven content
  related: []
  questions:
    - How is the fundraiser’s impact calculated?
    - Show me other community projects.
---

It began with a wooden-wick candle. Jamie bought one at a market, loved its crackle, and by early 2020 had a box of supplies from The Wooden Wick Co. and was [making his own](https://weekly.thingelstad.com/archive/137/). By the end of that year he had a [Wicky Thing Candles](https://web.archive.org/web/20201230115619/https://www.thingelstad.com/candles/) page with named scents like Lit, Cake Eater, and Man in the Pants. In September 2021 each family at Olson Family Vacation won a custom Wicky Thing candle in Tammy’s scavenger hunt ([WT194](https://weekly.thingelstad.com/archive/194/)).

That fall the family turned the candles into a fundraiser. The first Things 4 Good Fall Fundraiser, on 2021-11-06 and 07, sold 134 Wicky Thing Candles in four scents, along with the first Jiggy Thing Puzzle, Four Bees Honey from Tammy’s sister Angie, and cookies Tammy and the kids baked. It [raised $4,757](https://www.thingelstad.com/2021/11/09/things-good-fall.html) for four nonprofits, one picked by each of Jamie, Tammy, Mazie, and Tyler, with buyers choosing how to split their donation. The name plays on the family name: four Things, four causes.

It became a tradition. In 2022 the family made 180 candles and [sold 172](https://www.thingelstad.com/2022/11/27/101105.html), raising $5,217. Totals grew each year, to $5,755 in 2023 and $7,010 in 2024, when the first day of the sale moved to the Mount Olivet Holiday Boutique. The 2025 sale, marked with a “5th Anniversary” POAP, sold 321 candles and [raised $9,048](https://www.thingelstad.com/2025/11/16/things-good-candle-fundraiser-results.html), for [$31,787 over five years](https://www.thingelstad.com/2025/11/16/things-good-five-year-impact.html). Each year Jamie posts the results and a look at the sale’s data. The candles now go by the Things 4 Good name, and every candle is still a $25 donation.

In 2026 the fundraiser got its own site, [things4good.xyz](https://things4good.xyz/), with the sale, every organization supported, and the numbers by year, all calculated from one dataset of sale events. The 2026 sale, the sixth, is set for November 7 and 8, with a new Maker Night where six guests pour their own candles.
