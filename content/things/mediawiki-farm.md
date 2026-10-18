---
title: Thingelstad.com MediaWiki farm
summary: One MediaWiki installation that ran about a dozen of Jamie’s wikis, from WikiApiary and the Planet Kubb Wiki to Road Sign Math.
collection: Historical projects
status: retired
url: https://web.archive.org/web/20151013153210/https://wikiapiary.com/wiki/Farm:Thingelstad.com
started: '2011'
ended: '2016'
topics:
  - mediawiki
  - semantic-mediawiki
sources:
  - kind: github
    repository: jthingelstad/wiki-farm
    role: implementation
  - kind: website
    url: https://web.archive.org/web/20151013153210/https://wikiapiary.com/wiki/Farm:Thingelstad.com
    role: reference
connections:
  - to: wikiapiary
    label: hosted
    detail: WikiApiary’s farm page described the farm as Jamie’s personal wiki farm and “the home of WikiApiary itself.”
    source: https://web.archive.org/web/20151013153210/https://wikiapiary.com/wiki/Farm:Thingelstad.com
  - to: planet-kubb
    label: hosted
    detail: The Planet Kubb Wiki was one of the farm’s wikis, with its own configuration file in the wiki-farm repository.
    source: https://github.com/jthingelstad/wiki-farm
  - to: road-sign-math
    label: hosted
    detail: Road Sign Math ran as a wiki on the farm, with its own configuration file in the wiki-farm repository.
    source: https://github.com/jthingelstad/wiki-farm
  - to: r-w-book-club
    label: hosted
    detail: The R/W Book Club’s MediaWiki site was one of the farm’s wikis.
    source: https://github.com/jthingelstad/wiki-farm
  - to: wikinosh
    label: hosted
    detail: Wikinosh was among the farm’s wikis that WikiApiary listed as defunct by 2015.
    source: https://web.archive.org/web/20151013153210/https://wikiapiary.com/wiki/Farm:Thingelstad.com
  - to: links-thing
    label: hosted
    detail: links_thing, Jamie’s Semantic MediaWiki bookmarking wiki, was among the farm’s wikis that WikiApiary listed as defunct by 2015.
    source: https://web.archive.org/web/20151013153210/https://wikiapiary.com/wiki/Farm:Thingelstad.com
  - to: foreground
    label: hosted
    detail: The farm ran a wiki for the Foreground skin at foreground.thingelstad.com.
    source: https://github.com/jthingelstad/wiki-farm
  - to: tosredux
    label: hosted
    detail: TOSRedux was one of the farm’s active wikis in WikiApiary’s October 2015 record.
    source: https://web.archive.org/web/20151013153210/https://wikiapiary.com/wiki/Farm:Thingelstad.com
---

A MediaWiki farm is one MediaWiki installation that serves many separate wikis. Jamie ran one at thingelstad.com from 2011, when a [move to Linode](https://www.thingelstad.com/2011/11/20/move-to-linode.html) put “all of my wiki and blog instances running under one PHP install,” and in August 2014 he wrote that he had been running it “for a couple of years now hosting about a dozen wikis ranging from small to very large” ([MediaWiki LocalSettings for Farmers](https://www.thingelstad.com/2014/08/24/mediawiki-localsettings-for.html)). He published the configuration as the [wiki-farm](https://github.com/jthingelstad/wiki-farm) repository because farm setups were poorly documented. It keeps a core configuration file for each wiki, shared modules that switch on capabilities, and secrets kept out of source control.

WikiApiary’s own record of the farm, captured in October 2015, called it “Jamie Thingelstad’s personal wiki farm” and the home of WikiApiary itself. Its active wikis then included WikiApiary, the Planet Kubb Wiki, the Minnestar wiki, the R/W Book Club, Road Sign Math, Wiki thing, Foreground, AWS MN and TOSRedux. Earlier wikis, among them Wikinosh, Kernest Wiki, links_thing, Rhone links, BODWiki and Filament, had already stopped reporting. Some early wikis did not last: in February 2012 he [shut down](https://www.thingelstad.com/2012/02/08/shutting-down-some.html) the MediaWiki Cookbook and a sandbox wiki. Jamie kept the farm on current releases, including [MediaWiki 1.20](https://www.thingelstad.com/2012/11/06/took-a-moment.html) in November 2012 and [1.21](https://www.thingelstad.com/2013/05/25/got-my-mediawiki.html) in May 2013.

In May 2016 Jamie decided to stop running his own servers and to archive or hand off his hobby sites ([Technical Downsizing](https://www.thingelstad.com/2016/05/03/technical-downsizing.html)). Road Sign Math was one of the sites he shut down that year ([Road Sign Math](https://www.thingelstad.com/2023/10/21/road-sign-math.html)). The wiki-farm repository is archived on GitHub.
