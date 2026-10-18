---
title: WikiApiary
summary: A Semantic MediaWiki site that tracks thousands of MediaWiki wikis, their software, extensions, and editing activity.
collection: Historical projects
status: dormant
url: https://wikiapiary.com/wiki/Main_Page
started: '2012-12-21'
topics:
  - mediawiki
  - semantic-mediawiki
sources:
  - kind: website
    url: https://wikiapiary.com/wiki/Main_Page
    role: website
  - kind: github
    repository: WikiApiary/WikiApiary
    role: implementation
  - kind: github
    repository: WikiApiary/wikibees
    role: successor
connections:
  - to: foreground
    label: is skinned with
    detail: WikiApiary’s distinctive look came from the Foreground skin, which Jamie worked on for WikiApiary.
    source: https://www.thingelstad.com/2013/12/22/one-year-for.html
---

WikiApiary is “a wiki to track other wikis.” Once a MediaWiki site is registered, a set of bots collects its software versions, extensions, skins, and editing statistics, and the wiki keeps the history so it can be charted and queried. It is built with MediaWiki and Semantic MediaWiki. Jamie started it as a holiday-break project in 2012; [MediaWiki.org](https://www.mediawiki.org/wiki/WikiApiary) dates it to December 21, 2012.

After its first year it was collecting from 9,555 active wikis and had stored more than 1.8 billion statistics samples, with over 3.3 million property values of its own ([One Year for WikiApiary](https://www.thingelstad.com/2013/12/22/one-year-for.html)). Jamie called it the first project he started that grew a real community around it. Karsten Hoffmeyer helped administer it, Mark Hershberger explored ways for wikis to register themselves, Paul DeCoursey rewrote the chart code, and Federico Leva linked MediaWiki.org’s extension pages to their WikiApiary pages, which brought much of its traffic.

Jamie later handed the site to Mark Hershberger, who wrote in April 2017 that he had “[inherited the site from Jamie Thingelstad](https://lists.wikimedia.org/hyperkitty/list/wikiapiary@lists.wikimedia.org/message/HRNMPDZBNH5DWCWEFWMKLJAACDQDOAPY/).” That October, Hershberger and his son Basil began [moving it from the old Linode servers to Wikimedia Cloud Services](https://lists.wikimedia.org/hyperkitty/list/wikiapiary@lists.wikimedia.org/message/R7TRLEB73RKAGGA22VE3JAVW3YZOQSMF/). At its size the wiki has struggled with database timeouts: it [came back online](https://lists.wikimedia.org/hyperkitty/list/wikiapiary@lists.wikimedia.org/message/7HK7OPHOID3ZLCYSZTNPXDPG7MHTXGMV/) in March 2023 after an upgrade to MediaWiki 1.39, was [in write-only mode](https://lists.wikimedia.org/hyperkitty/list/wikiapiary@lists.wikimedia.org/message/AMVVOP72ONA2YI7XJ7KV6O3K42BBBES4/) by that September, and MediaWiki.org marked it not operational in February 2025.

In March 2026 Brian Wolff [got the site serving pages again](https://lists.wikimedia.org/hyperkitty/list/wikiapiary@lists.wikimedia.org/message/W5UMMJTSPGP7ZFT2NPTLCFHVVUXOLIOO/), with the update bots still off, and in May 2026 Hershberger announced from the Wikimedia Hackathon that WikiApiary and its bots [were moving to a Kubernetes cluster](https://lists.wikimedia.org/hyperkitty/list/wikiapiary@lists.wikimedia.org/message/DCSXARUPRRYZO4XKTTJXYIDM3T5AAGIV/) so it could start crawling wikis again.
