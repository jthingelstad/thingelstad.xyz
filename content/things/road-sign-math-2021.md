---
title: Road Sign Math (2021)
summary: 'Road Sign Math as a simple blog of the signs Jamie’s family found from 2021 to 2025, first at roadsignmath.thingelstad.com and from 2023 on Micro.blog at roadsignmath.xyz.'
collection: Games and communities
status: retired
url: https://web.archive.org/web/20260909070315/https://www.roadsignmath.xyz/
started: '2021-03'
ended: '2026-10-30'
topics:
  - play
  - open-web
sources:
  - kind: website
    url: https://web.archive.org/web/20260909070315/https://www.roadsignmath.xyz/
    role: archive
  - kind: website
    url: https://weekly.thingelstad.com/archive/177/
    role: reference
  - kind: website
    url: https://www.thingelstad.com/2023/10/21/road-sign-math.html
    role: reference
  - kind: website
    url: https://www.thingelstad.com/2025/09/01/it-always-makes-me-smile.html
    role: reference
  - kind: github
    repository: jthingelstad/rsm.thingelstad.com
    role: historical
connections:
  - kind: lineage
    to: road-sign-math-2026
    label: was succeeded by
    detail: In October 2026 the 16 signs on the blog became the first signs in the Road Sign Math iPhone app, and the new roadsignmath.xyz replaced the blog.
    source: https://github.com/jthingelstad/roadsignmath.xyz/pull/2
story:
  color: '#287454'
  introduction: Just my signs.
  engineering:
    - The blog runs on Micro.blog, with one post per sign, its photo, and the math typeset with MathJax from TeX in the post.
    - The 2021 posts keep their 2021 dates on Micro.blog, though their photos were uploaded there in 2023.
  stack:
    - Micro.blog
    - MathJax
  source: https://web.archive.org/web/20260909070315/https://www.roadsignmath.xyz/
  sourceLabel: See the blog in the Internet Archive
  related:
    - road-sign-math
    - road-sign-math-2026
  started: Posted from 2021 to 2025
  questions:
    - Why did Road Sign Math come back as a blog without scores?
    - Which signs were posted on the Road Sign Math blog?
bundles:
  - id: the-blog
    title: The blog
    caption: What was left of the blog when the new roadsignmath.xyz replaced it on October 30, 2026.
artifacts:
  - file: front-page-2026-10.jpg
    bundle: the-blog
    title: The front page
    caption: The blog’s front page on October 20, 2026, ten days before it was replaced, with its newest sign, the one Tyler found driving up I-35W, its math typeset under the post.
    date: '2026-10-20'
  - file: posts-2021-2025.json
    bundle: the-blog
    title: Every post, as Micro.blog exported it
    caption: All 16 posts from March 2021 to September 2025 as a JSON Feed, with each post’s words, its math in TeX, the name of its photo and its date. Thirteen are my signs, two are Tyler’s and one is Tammy’s, in six states.
    date: '2026-10-30'
---

Jamie let Road Sign Math’s first site go in 2016. In 2017 he started a Jekyll site for the signs, [rsm.thingelstad.com](https://github.com/jthingelstad/rsm.thingelstad.com), on a stock theme. It never got past the theme’s sample posts. In March 2021 a sign Tammy found near Phoenix gave Road Sign Math “a breath of new life” at roadsignmath.thingelstad.com ([Weekly Thing 177](https://weekly.thingelstad.com/archive/177/)), and that summer the family found ten more on a [Vermont road trip](https://www.thingelstad.com/2021/08/15/varmont-road-trip.html).

He registered roadsignmath.xyz in 2021, and in October 2023 [rebooted](https://www.thingelstad.com/2023/10/21/road-sign-math.html) Road Sign Math a second time, as a simple blog on Micro.blog: “Just my signs. No scoring system or leaderboards.” New signs kept turning up, like one in [September 2025](https://www.thingelstad.com/2025/09/01/it-always-makes-me-smile.html), the last of 16.

Why the second version was a simple blog, in his words:

> So the second version was a direct response to us making a three-day road trip to Arizona. And Tammy made these envelopes of activities that the kids could do to keep them busy. One of them was to play Road Sign Math, and there was a prize if they were able to find signs. And it was just, I loved it because it brought this thing that I had built back into our family. … So I decided to bring it back with a blog and just keep it simple and focus on just having fun.
>
> [Jamie, question 10](https://thingelstad.xyz/interviews/jamie-october-2026/#q10)

On October 30, 2026, the new roadsignmath.xyz replaced the blog, and its 16 signs became the first signs in the Road Sign Math iPhone app. The blog kept the game alive until he was ready to build the app.
