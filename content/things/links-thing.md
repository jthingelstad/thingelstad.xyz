---
title: links_thing
summary: Jamie’s 2012 bookmarking wiki, built on Semantic MediaWiki with forms, a bookmarklet, and calendar, video and statistics views.
collection: Historical projects
status: retired
url: https://www.thingelstad.com/2012/07/01/bookmarking-with-semantic.html
started: '2012-04'
topics:
  - semantic-mediawiki
  - mediawiki
sources:
  - kind: website
    url: https://www.thingelstad.com/2012/07/01/bookmarking-with-semantic.html
    role: reference
connections: []
---

After months of thinking about hosting his own bookmarks, Jamie built links_thing in 2012; it was online by [April](https://web.archive.org/web/20120424043815/http://links.thingelstad.com:80/wiki/Main_Page), showing his last 50 bookmarks. It was a wiki on [Semantic MediaWiki](https://www.semantic-mediawiki.org/) where each page in the Bookmark category is one bookmark with properties such as its URL, creation time and excerpt ([Bookmarking with Semantic MediaWiki](https://www.thingelstad.com/2012/07/01/bookmarking-with-semantic.html)). Semantic Forms made entry easy, and a bookmarklet filled in the URL, title and excerpt of the page he was on. He imported just under 4,000 links from Pinboard’s JSON export with a small Python script and the Data Transfer extension.

Owning the data was the point: “It is mine,” he wrote. He could clean up every bookmark with regular-expression find and replace, and he added views no bookmarking service offered: bookmarks on a calendar, embedded YouTube and Vimeo videos, statistics, and a template that flagged short URLs and tracking tags for a bot to clean up. He was also building LinkBot, a scheduled Python program to validate URLs. On [Open Loop #0](https://www.thingelstad.com/projects/open-loop/0-but-no-shoes/) he described it as “35 lines of Python” that checked five random bookmarks an hour, followed redirects, and stripped tracking codes.

The wiki ran on Jamie’s [MediaWiki farm](https://web.archive.org/web/20151013153210/https://wikiapiary.com/wiki/Farm:Thingelstad.com). By 2015 WikiApiary listed it among the farm’s defunct wikis, with 7,178 pages and a last sample in October 2014. Jamie was collecting links in Pinboard again when he started the Weekly Thing in 2017 ([Assembling the Weekly Thing](https://www.thingelstad.com/2017/06/23/assembling-the-weekly.html)).
