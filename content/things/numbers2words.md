---
title: Numbers2Words
summary: 'A MediaWiki parser function from 2011 that spells out a number in words.'
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

Numbers2Words adds an `{{#n2w:}}` parser function to MediaWiki. Give it a number and it hands back that number written out in words, using the PEAR [Numbers_Words](https://pear.php.net/package/Numbers_Words) package. The [whole extension](https://github.com/jthingelstad/Number2Words/blob/master/Number2Words.php) is one short PHP file, and 0.0.1 is the only version there ever was.

Jamie wrote it in July 2011, and Wikinosh ran it. In January 2013 [WikiApiary listed Numbers2Words 0.0.1](https://web.archive.org/web/20130103025340/http://wikiapiary.com/wiki/Wikinosh) among Wikinosh’s extensions, and the Wikinosh [main page](https://web.archive.org/web/20111205190345/http://wikinosh.com/wiki/Main_Page) used it to spell out its counts, like “thirteen thousand seven hundred fifty-three food records.”

The same package came back in 2014, when he used Numbers_Words to write a spelled-out number challenge for MediaWiki’s QuestyCaptcha ([Updated Dynamic Questy Captchas](https://www.thingelstad.com/2014/10/28/updated-dynamic-questy.html)) and then for Question2Answer. The last change to the repository, in 2015, fixed the include. It is archived.
