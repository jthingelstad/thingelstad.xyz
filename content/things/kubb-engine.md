---
title: Kubb Engine
summary: 'The rules, physics, notation and session of Kubb: Throwing Wood, as pure Lua. It was taken out of the Playdate game on November 17, 2026, and each release is a tag that the Playdate, web and iPhone games carry byte for byte.'
collection: Games
status: active
url: https://throwingwood.com/engine/
started: '2026-11-17'
topics:
  - play
  - agents
sources:
  - kind: website
    url: https://throwingwood.com/engine/
    role: reference
  - kind: github
    repository: jthingelstad/kubb-engine
    role: implementation
connections:
  - to: kubb-throwing-wood
    label: was taken out of
    detail: The core began inside the Playdate game on November 13, 2026, and came out of it on November 17 with its history. The Playdate game now carries the engine’s core from a tagged release.
    source: https://github.com/jthingelstad/kubb-engine
  - to: planet-kubb-score
    label: writes its games in
    detail: The engine’s notation writer saves every match as a game file in Planet Kubb Notation, and its tests read each one back with the notation’s own grammar.
    source: https://thingelstad.xyz/things/planet-kubb-score/
face: levels.png
story:
  color: '#8c3510'
  introduction: One game, three screens, the same throw.
  engineering:
    - Pure Lua 5.4 with no drawing, input, network or file access. A client brings those and talks to the engine through one call, kubbCall, with JSON in and out.
    - 'Three parts: the core (rules, physics, the throw, the computer thrower and the notation), the session (a practice pitch or a match behind that one call) and the room (a shared pitch’s document and who may act in it).'
    - Each release is a tag. A client copies a tagged release byte for byte and checks every file against the sha256 in that release’s engine.json, so a copy that drifts fails its own tests.
    - The reference results are WebAssembly’s, from wasmoon 1.16.0 with musl’s math. Thirteen golden matches keep a hash after every action, 523 of them at 0.9.0, and a change that moves one needs a new minor version.
    - A game may carry several engines, and each match runs on its own. A shared pitch plays on the newest version that the host and every player carry, so an older build can still join.
    - Physics measuring tools sit beside the tests, a fuzzer, a comparison with MuJoCo, a reader for tournament game files and the Kubb Gym, and none of them changes the game.
  stack:
    - Lua 5.4
    - WebAssembly
    - wasmoon
    - musl
    - Node
  source: https://github.com/jthingelstad/kubb-engine
  sourceLabel: Read the engine
  related:
    - kubb-throwing-wood
    - kubb-throwing-wood-web
    - kubb-throwing-wood-iphone
    - planet-kubb-score
  started: Taken out of the Playdate game November 17, 2026
  questions:
    - How can a phone and a browser throw exactly the same baton?
    - What decides whether a change is a new version?
    - How close is the computer to tournament players?
bundles:
  - id: releases
    title: A release and its checks
    caption: Files from the engine’s repository at its tag v0.7.1, November 19, 2026, as they are there.
  - id: release-0-9-0
    title: 'Release 0.9.0, against the real games'
    caption: Files from the engine’s repository at its tag v0.9.0, November 20, 2026, as they are there, and a chart drawn for this page from the table in its pull request.
  - id: engine-page
    title: The engine’s own page
    caption: 'The top of throwingwood.com/engine/, as a browser saw it on the afternoon of November 20, 2026, 1280 pixels wide.'
  - id: levels
    title: The computer’s levels
    caption: The count of November 17, 2026, once the computer’s three levels were set against the tournament games. The chart was drawn for this page from the figures in the engine’s notes.
artifacts:
  - file: engine-0.7.1.json
    bundle: releases
    title: What a client checks its copy against
    caption: The engine’s name and version, where its core, session and room were taken from, a sha256 for each of its 53 Lua files, and one for the whole engine as a single bundle.
    date: '2026-11-19'
    source: https://github.com/jthingelstad/kubb-engine/blob/v0.7.1/engine.json
  - file: golden-hashes.json
    bundle: releases
    title: The golden matches
    caption: Twelve matches the computer plays against itself, on grass, sand and snow, with no wind, light wind and strong wind, each team throwing first, and the hash of the match after each of their 437 throws. Every release replays them in WebAssembly and must agree with every one, or say in its version that it does not.
    date: '2026-11-18'
    source: https://github.com/jthingelstad/kubb-engine/blob/v0.7.1/tests/golden/hashes.json
  - file: versioning.md
    bundle: releases
    title: The version rules
    caption: What a major, a minor and a patch release mean, why two players share a match only on the same major and minor version, and a note for each release from 0.2.0 to 0.7.1.
    date: '2026-11-19'
    source: https://github.com/jthingelstad/kubb-engine/blob/v0.7.1/docs/VERSIONING.md
  - file: determinism.md
    bundle: releases
    title: Why the reference is WebAssembly
    caption: Why every browser gets the same floats, what a native host has to build to agree with them, and how far stock Lua on a Mac strays, measured on November 17, 2026.
    date: '2026-11-17'
    source: https://github.com/jthingelstad/kubb-engine/blob/v0.7.1/docs/DETERMINISM.md
  - file: real-games-0.9.0.png
    bundle: release-0-9-0
    title: 0.8.2 and 0.9.0 against the tournaments
    caption: The 150 tournament games in blue, 150 matches on engine 0.8.2 in gray and 150 on 0.9.0 in orange. Batons at field kubbs miss 25.1 percent of the time on 0.9.0, where they had missed 31.3, against the tournaments’ 24.7. A game runs 15.6 turns, down from 24.1; in the tournaments it runs 8.9.
    date: '2026-11-20'
    source: https://github.com/jthingelstad/kubb-engine/pull/18
  - file: engine-0.9.0.json
    bundle: release-0-9-0
    title: What a client checks its copy against, at 0.9.0
    caption: The same manifest three days on, with a sha256 for each of its 55 Lua files and one for the whole engine as a single bundle.
    date: '2026-11-20'
    source: https://github.com/jthingelstad/kubb-engine/blob/v0.9.0/engine.json
  - file: golden-hashes-0.9.0.json
    bundle: release-0-9-0
    title: The golden matches, at 0.9.0
    caption: Thirteen matches and the hash of each after every one of their 523 actions. The thirteenth, added in 0.8.0, has a person throw at field kubbs from 0.35 to 2 meters. A minor version brings a new set, and 0.9.0 is one.
    date: '2026-11-20'
    source: https://github.com/jthingelstad/kubb-engine/blob/v0.9.0/tests/golden/hashes.json
  - file: versioning-0.9.0.md
    bundle: release-0-9-0
    title: The version rules, at 0.9.0
    caption: The rules as they stood at 0.9.0, with how a game carries several engines, what a game shows as its version, and a note for each release up to 0.9.0.
    date: '2026-11-20'
    source: https://github.com/jthingelstad/kubb-engine/blob/v0.9.0/docs/VERSIONING.md
  - file: engine-page.png
    bundle: engine-page
    title: The Kubb Engine, for a reader
    caption: '“A baton clips a corner. One kubb tips into the next. KLAK. The engine is the code that decides where the wood goes.” Under it: one engine, three games, and the checks against real kubb, 150 tournament games, 220 moments on video and 1,063 physics tests.'
    date: '2026-11-20'
    source: https://throwingwood.com/engine/
  - file: levels.png
    bundle: levels
    title: Beginner, club and pro against the tournaments
    caption: The 150 tournament games in blue and 150 matches at each of the computer’s levels in three shades, light to dark. Pro misses a field kubb as often as tournament players do and fells a base kubb from 8 meters as often; what it still does not do is take two or three kubbs with one baton. A game runs 8.9 turns in the tournaments, 17.8 at pro, 20.5 at club and 25.2 at beginner.
    date: '2026-11-17'
---

The Kubb Engine is Kubb: Throwing Wood with the screen taken away. It is pure Lua: the rules of a match, the physics of batons, kubbs and the king, the throw, the computer thrower, and the writer that saves every match in [Planet Kubb Notation](/things/planet-kubb-score/). It draws nothing, reads no buttons and touches no network or file. A game brings those, and asks the engine everything else through one call.

It began on November 13, 2026, as the core of [the Playdate game](/things/kubb-throwing-wood/), and on November 17 it came out of it, history and all, along with the session and the room from [the game on the web](/things/kubb-throwing-wood-web/). The session holds a practice pitch or a match; the room holds a shared pitch and who may act in it. Three games run it now: the Playdate game, which takes the core, and the web game and [the iPhone game](/things/kubb-throwing-wood-iphone/), which take all of it.

Each release is a tag, and a tag is never moved. A game copies a tagged release byte for byte and never edits its copy; [a manifest](#artifact-engine-0.7.1.json) gives a sha256 for every file, and each game’s tests fail when its copy does not match. A fix is made in the engine, released, and then each game moves to the new tag. There were nine tags in its first three days, from 0.2.0 on November 17 to 0.7.1 on November 19: the room, a touch pendulum, a throw that turns by the thrower’s level, a straight-through throw tried and taken out again, and shorter player names on the score sheet.

A version number here says something exact. [The rules](#artifact-versioning.md) make a patch a change that leaves every result the same, a minor version anything that could change where a baton lands, and a major version a change to what a game stores or sends. Two players may share a match only when their engines agree on the first two numbers, and a pitch refuses to start when they do not.

That matters because a phone and a browser have to agree on every throw, to the last bit. The physics calls sine, cosine and square root thousands of times a throw, and the math libraries in different systems can differ in the last digit, which grows into a different landing within a few throws. So [the reference](#artifact-determinism.md) is one platform: Lua 5.4 compiled to WebAssembly by wasmoon 1.16.0, whose math is musl’s, the same bytes in every browser. [Twelve golden matches](#artifact-golden-hashes.json) keep a hash of the match after every throw, and every release is played against them. Stock Lua on a Mac, measured on November 17, parted from it at the fourth throw of the first golden match. The iPhone game builds musl’s math into its own Lua and matches the web hash for hash. The Playdate’s 32-bit floats never agree with either, so it plays alone.

The computer’s throwing is tuned against real play. Jamie, on November 15: “in a tournament I would have hit all five down with one baton” ([the engine’s notes](https://github.com/jthingelstad/kubb-engine/blob/main/docs/notes/real-games.md)). The 150 games recorded in Planet Kubb Notation were all played at tournaments, many of them late in a bracket. A tool reads those game files and 150 matches the computer plays against itself, and counts both the same way: how often a baton misses, takes one field kubb, two, or three and more, how often a turn clears the field, and how often the king falls.

The [first count](/things/kubb-throwing-wood/#artifact-real-games-before.txt), on November 16, 2026, showed where the game and the tournaments parted. With a field kubb standing, tournament players took two or more with one baton 26 times in 100; the computer 7, and its games ran 22 turns to their 9. A steadier arm did not close the gap. The cause was in how it threw its kubbs back in: every one was drilled at the same mark, came down on the kubb already lying there and skipped about a meter off, so its field kubbs stood 39 centimeters apart on average. A baton takes two kubbs when they stand close, one behind the other. So the computer now drills each kubb into the clear spot beside the last, in a line along the throw, and aims its batons down the line with the most kubbs in it. In [the count after](/things/kubb-throwing-wood/#artifact-real-games-after.txt) it takes two or more 22 times in 100, clears the field in 70 turns of 100 where it had cleared 46, and a game runs about 15 turns.

On November 16 a tester sent a report from inside the web version: six batons at one field kubb, and every one missed. A match there is kept as the actions its players sent, so this one could be [replayed](/things/kubb-throwing-wood/#artifact-replay-embed.png) exactly. Two of the throws were perfect. Both came down on an end about 30 centimeters short and vaulted over the kubb, because each throw was planned so that the baton’s center would arrive at the kubb’s foot. [It now aims through the kubb at half its height](/things/kubb-throwing-wood/#artifact-physics-pinned-case.png), and that throw is kept as a test of its own.

Play tests find problems slowly and at random, so that evening three checks were built that need no player. A fuzzer throws thousands of random batons and kubbs at random layouts and holds each throw to rules any physics has to keep: energy never rises by itself, pieces never pass into one another, everything comes to rest, a mirrored throw lands mirrored. A second engine, [MuJoCo](https://mujoco.org/), built for research and robotics, runs 1,063 small cases beside the game’s own. And throws from public Kubb videos were [measured frame by frame](/things/kubb-throwing-wood/#artifact-real-clips.json): how a drilled kubb lands and rolls, how a struck kubb falls, how far a row goes down. [The three agreed](/things/kubb-throwing-wood/#artifacts-three-checks): pieces slid too far once they landed or were struck, and MuJoCo showed why, friction missing from part of each impact.

The fixes went in that night, one at a time, each measured by all three checks first. A body in the air moves as the equations of motion say. A baton lying along a kubb meets it along its length. A kubb lying on another can come to rest. And an impact’s friction is part of its bounce, so [a drilled kubb runs on less](/things/kubb-throwing-wood/#artifact-physics-drill-run-on.png), a median of 68 centimeters on grass where it had been 88; real drills run on 22. The friction stopped a row of touching kubbs from falling as a row, so [the last fix of the night](/things/kubb-throwing-wood/#artifact-physics-row.png) lets the bounce carry along it. The counts, charts and reports of that work are kept on [the Playdate game’s page](/things/kubb-throwing-wood/#artifacts-real-games), where they were first collected, while the core was still part of it.

On November 17 the computer got three levels. The tournament games are the mark for pro (Jamie: “there is no professional kubb. So that is essentially the best kubb there is,” in [the same notes](https://github.com/jthingelstad/kubb-engine/blob/main/docs/notes/real-games.md)), and club and beginner sit below them. Before, the computer made the same mistakes at every level, so the wider targets forgave club and beginner more and they out-threw pro. Now every level throws on pro’s gauge with its own nerves, and its swing’s mistakes are scaled up, by 1.3 at club and 1.6 at beginner. [In the count](#artifact-levels.png), pro misses a field kubb about as often as tournament players and fells a base kubb from 8 meters as often. What it still does not do is take two or three kubbs with one baton, so its games run twice as long.

Between the evening of November 19 and the afternoon of November 20, seven more tags went out, from 0.7.2 to 0.9.0. The first two were for the server that publishes shared matches: what it needs to check a match against the computer before it keeps it, and a replay it can read in one pass.

Version 0.8.0 came from a tester’s report: two batons at a field kubb a step away, and it stayed standing. Every baton left the hand upright, above the thrower’s feet, so one meant for a kubb 35 centimeters away came down on its top and pressed it into the ground. Jamie, that day: “Real player when hitting a field Kubb that close will hit it low and hard in an attempt to roll the Kubb into other field kubbs” and “players miss when they attempt to overpower those throws” ([the pull request](https://github.com/jthingelstad/kubb-engine/pull/14)). So a person’s baton planned under 2 meters is now a low, firm bowl. The hand drops and reaches ahead, the loft flattens, and a swing past the power band lifts the baton over. At club level a good throw at a kubb 35 centimeters away had toppled it 2 times in 100; now it topples it every time. A thirteenth golden match throws batons like that.

Version 0.8.1 changed no throw. It lets a game carry several engines, and each match runs on its own. A shared pitch plays on the newest version that the host and every player carry, so a phone on an older build can still join a browser. Version 0.8.2 made a short baton’s plan about a tenth faster, with every number the same as before to the last bit, checked over 431,516 cases. The same day [the rules](#artifact-versioning-0.9.0.md) gained a line on what a game shows: its own version, then the engine’s in parentheses, as in 0.9.8 (0.8.1).

Version 0.9.0 is a minor version, so it has [a new set of golden matches](#artifact-golden-hashes-0.9.0.json), 13 of them with 523 hashes, and a pitch will not put a 0.8 player and a 0.9 player in one match. A kubb held up by the ground alone now comes to rest only on a face, never balanced on an edge; in 2,000 drills a surface, edge rests had been 1 in 143 on grass, 1 in 13 on sand and 1 in 62 on snow. Batons aim lower, at a kubb’s body, after a play-test match in which 29 of 41 first touches of a standing piece were on its top. The computer steps up to a kubb a step from the line and throws the same low bowl. Tilt, arc and spin take any value in their range, not only steps. A kubb’s spin is kept for the side’s next kubb in the turn. And the computer’s level is an option of the match, not of a player.

[Against the tournament games](#artifact-real-games-0.9.0.png), a game ran 24.1 turns on 0.8.2 and runs 15.6 on 0.9.0, where tournament players take 8.9. Batons at field kubbs missed 31.3 percent of the time and miss 25.1, against their 24.7. A turn clears every field kubb 63 times in 100, up from 51; theirs is 83. One change was tried and left out: a deader bounce for a baton planted on a kubb’s top made kubbs fall less often and moved every count away from the real games. At its tag the engine passes 405 tests of its core, 105 of the session and 101 of the room.

That evening the engine’s repository gained [the Kubb Gym](https://github.com/jthingelstad/kubb-engine/blob/main/docs/notes/gym.md), a measuring tool and not a change to the game. One command plays hundreds of seeded matches, thrown the way the computer throws and the way people throw, and puts the results on one page, a scorecard, beside the 150 tournament games. Every throw is read closely: where the baton landed, which part of a kubb it touched first and how, and what the kubb did. Odd throws are counted and listed, each with a command that plays it again. Another command compares two builds of the engine and prints only what moved, and another throws recorded throws again on a new build. It is there so the throw can be tuned from hundreds of games, not from play tests. Every pull request runs a quick scorecard, which fails only when a throw never comes to rest or a piece breaks the physics. No throw changed with it, the engine is still 0.9.0, and what to tune from it is Jamie’s call.

The engine has a page of its own on the game’s site. [The Kubb Engine](https://throwingwood.com/engine/) sets out for a reader how its throws are checked, against score sheets, video of real play and a second physics simulator.
