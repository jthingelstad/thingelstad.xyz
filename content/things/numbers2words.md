---
title: Numbers2Words
summary: A MediaWiki parser function I wrote in 2011 that spells out a number in words.
collection: Historical projects
status: retired
url: https://github.com/jthingelstad/Number2Words
started: '2011-07-20'
topics:
  - mediawiki
sources:
  - kind: github
    repository: jthingelstad/Number2Words
    role: implementation
connections: []
---

Numbers2Words adds an `{{#n2w:}}` parser function to MediaWiki. Given a number, it returns the number written out in words, using the PEAR [Numbers_Words](https://pear.php.net/package/Numbers_Words) package. The [whole extension](https://github.com/jthingelstad/Number2Words/blob/master/Number2Words.php) is one short PHP file, and 0.0.1 is its only version.

I wrote it in July 2011. Wikinosh ran it: in January 2013 [WikiApiary listed Numbers2Words 0.0.1](https://web.archive.org/web/20130103025340/http://wikiapiary.com/wiki/Wikinosh) among Wikinosh’s extensions, and Wikinosh’s [main page](https://web.archive.org/web/20111205190345/http://wikinosh.com/wiki/Main_Page) spelled out its counts, as in “thirteen thousand seven hundred fifty-three food records.”

The same package returned in 2014, when I used Numbers_Words to write a spelled-out number challenge for MediaWiki’s QuestyCaptcha ([Updated Dynamic Questy Captchas](https://www.thingelstad.com/2014/10/28/updated-dynamic-questy.html)) and then for Question2Answer. The repository’s last change, in 2015, fixed the include, and it is archived.
