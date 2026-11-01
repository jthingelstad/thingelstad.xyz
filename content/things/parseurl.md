---
title: ParseURL
summary: 'A tiny MediaWiki extension that exposes PHP’s parse_url, so a wiki page can pull the host, path, or query out of a URL.'
collection: Historical projects
status: retired
url: https://github.com/jthingelstad/ParseURL
started: '2013-07-15'
topics:
  - mediawiki
sources:
  - kind: github
    repository: jthingelstad/ParseURL
    role: implementation
connections: []
---

ParseURL adds two parser functions to MediaWiki. `{{#parseurl:}}` gives you one part of a URL, like its scheme, host, path, query, or fragment, using PHP’s [parse_url](https://www.php.net/manual/en/function.parse-url.php) function. `{{#parseurlquery:}}` gives you the value of a single query parameter, like the video ID in a YouTube link.

Jamie wrote it in one sitting on July 15, 2013, and posted that he had “[made a super simple MediaWiki extension for parsing URLs](https://www.thingelstad.com/2013/07/15/made-a-super.html).” All three commits in the repository are from that day. It did its one job, and the repository is archived now.
