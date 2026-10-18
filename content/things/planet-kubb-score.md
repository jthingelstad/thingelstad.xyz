---
title: Planet Kubb Score
summary: Jamie’s notation and scoring system for recording Kubb games, begun on Planet Kubb in 2012 and being rebuilt, not yet published.
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

Planet Kubb Score is Jamie’s system for writing down a game of Kubb “like a baseball box score.” He created it with a friend, and calls it “the very first scoring & notation system for Kubb” ([Fun Facts](https://www.thingelstad.com/about/fun-facts/)). By July 2012 the Planet Kubb Wiki had a [Notation page](https://web.archive.org/web/20120715062240/http://wiki.planetkubb.com/wiki/Notation) whose goals were a notation that scales from player-by-player detail to simple games, could be sent over Twitter “turn by turn, tweet by tweet,” and is language neutral.

The [scoring repository](https://github.com/Planet-Kubb/scoring) holds the Planet Kubb scoresheet, including version 11 from Garrick van Buren, added in July 2014. [PyKubb](https://github.com/Planet-Kubb/PyKubb), started in August 2014, is a Python module to analyze Kubb games and output statistics. That month Jamie [wrote a Backus-Naur form grammar](https://www.thingelstad.com/2014/08/27/what-did-i.html) for the notation, and in 2017 he mentioned having tried to write a parser for it with PyParsing ([Weekly Thing 25](https://weekly.thingelstad.com/archive/25/)).

Jamie is rebuilding the notation, grammar and scoresheets as a new site. It has not been published yet.
