---
title: Redirector
summary: The one place that answers for my old and misspelled domains. It sends each to where its pages live now, rescues old blog links post by post, and serves a teapot to scanners hunting for WordPress.
collection: Developer tools and systems
status: active
url: https://thingelstad.com/
started: '2026-09'
topics:
  - open-web
  - archives
sources:
  - kind: website
    url: https://thingelstad.com/
    role: reference
  - kind: website
    url: https://thingelstad.com/wp-login.php
    role: reference
connections:
  - to: jamie-thingelstad-blog
    label: keeps old links working for
    detail: Since October 31, 2026, an old address from the blog’s WordPress and earlier years goes straight to its post on www.thingelstad.com, tagged ref=thingelstad.com-archive. The first table matched 905 of them.
    source: https://thingelstad.com/Wintergreen-Plunge-Mittens/
  - to: weekly-thing
    label: sends weeklything.com to
    detail: weeklything.com and the misspelled weekly.thinglestad.com land on the newsletter.
    source: https://weeklything.com/
  - to: linking-things
    label: sends links.thingelstad.com to
    detail: The old link blog’s address has gone to Linking Things since October 28, 2026.
    source: https://links.thingelstad.com/
  - to: thingelstad-photography
    label: sends the old photography sites to
    detail: photos, photog and photography.thingelstad.com, dark for years, land on this site’s page for the photography.
    source: https://photos.thingelstad.com/
artifacts:
  - file: teapot.png
    title: The teapot
    caption: What a scanner gets for asking thingelstad.com for wp-login.php, answered with HTTP 418.
    date: '2026-10-31'
    source: https://thingelstad.com/wp-login.php
---

Over twenty years I have collected a lot of domains: the bare thingelstad.com, the micro.thingelstad.com the blog used for a while, weeklything.com, jamiethingelstad.com, and thinglestad.com with its letters swapped, the way people keep typing my name. Each needs to answer and send the visitor somewhere useful. For years that was a scatter of redirects at my registrar. In September 2026 I began moving them into one CloudFront distribution with a small function in front of it, and by late October every one of them was answered in one place.

It started as plumbing: a name in, a 301 out. A redirect keeps the path, so a deep link to an old host still reaches the same page on the new one, and it adds a `ref` naming the host it came from, so my analytics show which old names people still use.

On October 31, 2026 it started making decisions. The blog has moved from .Text to WordPress, Squarespace, Jekyll and Micro.blog, and links out on the web still point at addresses that stopped existing years ago. Sites that linked to them will never update, and search engines kept finding 404s. Now the function looks each old blog path up in a table of old addresses matched to their posts and sends the visitor straight to the post. The table started with 905 matches, made only where the old slug and date clearly point at one post. Each Saturday the paths still landing on a 404 are ranked by how many real visitors follow them, so I add matches where people actually arrive.

About a quarter of the requests were never people: scanners probing for `wp-login.php`, `xmlrpc.php` and `.env` files. They get their own answer, an HTTP 418 “I’m a teapot” page explaining that this house hasn’t run WordPress since April 20, 2016, with a haiku in the source for anyone who looks. Every request now records what the function decided (a mapped post, a teapot, a plain redirect, or a fixed page) in the access log, so I know exactly what it is doing.
