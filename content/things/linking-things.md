---
title: Linking Things
summary: Every link I have saved since 2005, one page per link, searchable and joined to the Weekly Thing issues that carried them.
collection: Publishing
status: active
url: https://links.thingelstad.xyz/
started: '2026-10-23'
topics:
  - open-web
  - archives
sources:
  - kind: github
    repository: jthingelstad/links.thingelstad.xyz
    role: implementation
  - kind: website
    url: https://links.thingelstad.xyz/
    role: reference
  - kind: website
    url: https://weekly.thingelstad.com/archive/274/
    role: reference
  - kind: website
    url: https://weekly.thingelstad.com/archive/352/
    role: reference
connections:
  - to: weekly-thing
    label: lists the links of
    detail: Every Weekly Thing issue has a page on Linking Things listing the links it carried, 6,867 links across 354 issues when the site went live.
    source: https://links.thingelstad.xyz/issues/
  - kind: lineage
    to: link-blog
    label: succeeds
    detail: In Weekly Thing 274 I wrote that if I made a link blog again, I wanted it “to not be blog-date-centric but instead content-keyword-search centric.” Linking Things is built around search, not dates.
    source: https://weekly.thingelstad.com/archive/274/
  - kind: lineage
    to: links-thing
    label: follows
    detail: links_thing gave each of just under 4,000 bookmarks its own wiki page in 2012. Linking Things gives every link I have saved its own page again.
    source: https://www.thingelstad.com/2012/07/01/bookmarking-with-semantic.html
---

Linking Things is every link I have saved since 2005, one page per link, and what connects them. When it went live on October 23, 2026, it held 16,524 links from 7,064 hosts, saved from August 2, 2005 to October 22, 2026. A link’s page shows the note I saved with it, when there is one, and the Weekly Thing issue that carried it: 6,867 of the links appeared in one of 354 issues, and each issue has a page listing its links. Every host and every year has a page too. Search runs in the browser with Pagefind, and every link has a Kudos button.

It is built for machines as well as people. Each link’s page has a JSON and a Markdown twin, the whole collection is one JSON file, and `llms.txt` points to a file of links for each year. RSS and JSON feeds carry the newest links, and every host has a pair of its own. It is a static Astro site on S3 and CloudFront, so no server, database or model answers a visitor.

I built it on October 23, 2026, with coding agents. It is my third run at the idea: in 2012 I built links_thing, a bookmarking wiki on Semantic MediaWiki, and from 2017 to 2021 I ran Link Thing, a link blog that I relaunched in 2020. In [Weekly Thing 274](https://weekly.thingelstad.com/archive/274/) in January 2024, I wrote, “I may create a link blog again in the future, but if I did I want it to not be blog-date-centric but instead content-keyword-search centric.” This one starts from search, not from dates.

The reason for all of it is the hyperlink. In [Weekly Thing 352](https://weekly.thingelstad.com/archive/352/) in October 2026, I called the link, not HTML or a web page, “the fundamental building block of the web,” and wrote, “Long live the hyperlink!” Topics to browse by, and the nearest neighbours of each link, come later.
