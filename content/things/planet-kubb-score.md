---
title: Planet Kubb Score
summary: My notation and scoring system for recording Kubb games, begun on Planet Kubb in 2012. I am rebuilding it, and it is not published yet.
collection: Games and communities
status: active
url: null
started: '2012'
topics:
  - play
  - archives
sources:
  - kind: website
    url: https://web.archive.org/web/20120715062240/http://wiki.planetkubb.com/wiki/Notation
    role: archive
  - kind: github
    repository: Planet-Kubb/scoring
    role: historical
  - kind: github
    repository: Planet-Kubb/PyKubb
    role: historical
connections:
  - to: planet-kubb
    label: began on
    detail: The notation was first published on the Planet Kubb Wiki, and the scoring materials live in the Planet Kubb GitHub organization.
    source: https://web.archive.org/web/20120715062240/http://wiki.planetkubb.com/wiki/Notation
---

Planet Kubb Score is my system for writing down a game of Kubb “like a baseball box score.” I created it with Garrick van Buren, who said on [Open Loop #3](https://www.thingelstad.com/projects/open-loop/3-kubb-fever/) in July 2012 that we had been working on it “almost from the very beginning” and who drew up the first scoresheet. I call it “the very first scoring & notation system for Kubb” ([Fun Facts](https://www.thingelstad.com/about/fun-facts/)). By July 2012 the Planet Kubb Wiki had a [Notation page](https://web.archive.org/web/20120715062240/http://wiki.planetkubb.com/wiki/Notation) whose goals were a notation that scales from player-by-player detail to simple games, could be sent over Twitter “turn by turn, tweet by tweet,” and is language neutral.

The [scoring repository](https://github.com/Planet-Kubb/scoring) holds the Planet Kubb scoresheet, including version 11 from Garrick, added in July 2014. [PyKubb](https://github.com/Planet-Kubb/PyKubb), started in August 2014, is a Python module to analyze Kubb games and output statistics. In October 2013 I was “proud of” a [new scoresheet with on-pitch stats](https://www.thingelstad.com/2013/10/31/proud-of-this.html). In August 2014 I [wrote a Backus-Naur form grammar](https://www.thingelstad.com/2014/08/27/what-did-i.html) for the notation, and in 2017 I mentioned having tried to write a parser for it with PyParsing ([Weekly Thing 25](https://weekly.thingelstad.com/archive/25/)).

I am rebuilding the notation, grammar and scoresheets as a new site. It is not published yet, but it is coming.
