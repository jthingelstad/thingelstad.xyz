---
title: 'One game of Kubb, written once'
summary: 'Kubb: Throwing Wood began on the Playdate on November 13, 2026. Four days later its rules and physics came out as the Kubb Engine, which a browser and an iPhone carry byte for byte, so the two compute the same throw. Every match is written down in Planet Kubb Notation, which Jamie began in 2012.'
things:
  - kubb-throwing-wood
  - kubb-throwing-wood-web
  - kubb-engine
  - kubb-throwing-wood-iphone
  - planet-kubb-score
started: '2012'
---

Kubb: Throwing Wood started on [the Playdate](/things/kubb-throwing-wood/) on November 13, 2026. The crank is the throwing arm, read as a clock: pulled back it sets the power, and where it stops on the way forward sets the arc. Claude writes the code, in Lua, and Jamie plays each build on his Playdate and says what is wrong with it. [The first match](/things/kubb-throwing-wood/#artifact-first-match.txt) on a real Playdate was played that first day. It ran six turns in seven minutes, ended when Team B resigned, and was saved as a game file in Planet Kubb Notation.

Two days later, on November 15, Claude built [the same game for a web browser](/things/kubb-throwing-wood-web/) in one day. The Playdate game’s own Lua runs in it unchanged, compiled to WebAssembly, with a dial in place of the crank. Friends open a link, pick a side and play one match, each on their own screen. The browser of whoever throws decides the throw and sends it, and every other browser replays it on its own copy of the pitch and checks a hash of the match.

On November 17 the core came out of the Playdate game, history and all, as [the Kubb Engine](/things/kubb-engine/). It is pure Lua that draws nothing and reads no buttons; a game brings those. Each release is a tag. A game copies a tagged release byte for byte and never edits its copy, and [a manifest](/things/kubb-engine/#artifact-engine-0.7.1.json) gives a sha256 for every file, so a copy that drifts fails its own tests.

[The iPhone game](/things/kubb-throwing-wood-iphone/) was begun the same day. It is written in Swift, but the game in it is the engine. For a phone and a browser to share a match, every throw has to land in the same place on both, to the last bit. The physics calls sine, cosine and square root thousands of times a throw, and math libraries can differ in the last digit, which grows into a different landing within a few throws. Stock Lua on a Mac, measured on November 17, parted from the browser at the fourth throw of the first [golden match](/things/kubb-engine/#artifact-golden-hashes.json). So [the reference](/things/kubb-engine/#artifact-determinism.md) is the browser’s, Lua in WebAssembly with musl’s math, and the app compiles musl’s math into its own Lua. Its tests play the engine’s twelve golden matches and check every hash. The Playdate’s 32-bit floats never agree with either, so it plays alone.

The iPhone game went into TestFlight with a small group of testers on November 18. On November 19 it became an iPad app as well. Jamie: “The idea of an iPad version would just be to give us a little bit bigger screen” ([the app’s notes](https://github.com/jthingelstad/throwingwood-ios/blob/main/docs/RENDER.md)). So the engine’s core plays on a Playdate, and all of it in a browser, on an iPhone and on an iPad.

Every one of them keeps score the same way. The engine’s notation writer saves each match as a game file in [Planet Kubb Notation](/things/planet-kubb-score/), and its tests read each one back with the notation’s own grammar. The same notation holds the 150 tournament games the computer’s throwing is tuned against. They are the mark for its Pro level. Jamie: “there is no professional kubb. So that is essentially the best kubb there is” ([the engine’s notes](https://github.com/jthingelstad/kubb-engine/blob/main/docs/notes/real-games.md)).

The notation is fourteen years older than the game. Jamie began it on Planet Kubb in 2012 with Garrick van Buren, who drew up the first scoresheet. In the interview he remembered that [“we brainstormed a lot around things like the Planet Kubb notation system and score sheets”](https://thingelstad.xyz/interviews/session-2/#q17). By July 2012 the wiki’s [Notation page](https://web.archive.org/web/20120715062240/http://wiki.planetkubb.com/wiki/Notation) set out a notation that could be sent over Twitter “turn by turn, tweet by tweet.” In August 2014 Jamie [wrote a grammar](https://www.thingelstad.com/2014/08/27/what-did-i.html) for it. He is rebuilding the notation, grammar and scoresheets as a new site, and it is not published yet.

One game, written once: a crank on a Playdate, a link for friends, a phone in the hand, and a notation from 2012 keeping the score.
