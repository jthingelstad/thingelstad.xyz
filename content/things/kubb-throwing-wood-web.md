---
title: 'Kubb: Throwing Wood on the web'
site_name: 'Kubb: Throwing Wood'
summary: 'The Playdate game Kubb: Throwing Wood in a web browser: a match on a link with friends, a match against the computer, or the practice pitch, thrown with a dial in place of the crank.'
tagline: 'The Playdate Kubb game in a web browser, with friends on one pitch at a link.'
collection: Games
status: active
url: https://throwingwood.com/
started: '2026-11-15'
topics:
  - play
  - agents
sources:
  - kind: website
    url: https://throwingwood.com/
    role: website
connections:
  - to: kubb-throwing-wood
    label: runs the code of
    detail: The Playdate game’s own Lua core, its geometry, physics, rules, throwing order, computer thrower and notation, runs unchanged in the browser. The dial stands in for the crank, and the look is the game’s Woodcut in colour.
    source: https://throwingwood.com/
face: tok.png
story:
  color: '#3f7a2e'
  introduction: Friends on one pitch, each on their own screen.
  engineering:
    - The Playdate game’s Lua core (geometry, physics, rules, throwing order, the computer thrower and the notation) runs unchanged in the browser, compiled as Lua 5.4 in WebAssembly with wasmoon, so the same throw gives the same result in every browser.
    - The crank is a dial. A press on the dial and a drag round it winds back, a swing forward and a let-go releases, and the pointer’s motion feeds the same swing code the crank does. The target circle is dragged on the pitch.
    - In a shared match the browser of whoever throws decides the throw and sends the launch. Every other browser replays it on its own copy of the pitch and checks a hash of the match. While someone aims, the others watch their aim and their dial move.
    - The room server is small and knows no Kubb, an API Gateway WebSocket API with one Lambda function and DynamoDB. There are no accounts, and a room expires after 48 hours.
    - The site is static, on S3 behind CloudFront, drawn with JavaScript on a canvas.
  stack:
    - Lua 5.4
    - WebAssembly
    - JavaScript
    - API Gateway
    - AWS Lambda
    - DynamoDB
    - CloudFront
  source: https://throwingwood.com/
  sourceLabel: Start a pitch
  related:
    - kubb-throwing-wood
    - planet-kubb-score
    - planet-kubb
  started: Opened November 15, 2026
  questions:
    - How do my friends join a match?
    - How does a dial stand in for the crank?
    - Why does every browser see the same throw?
bundles:
  - id: on-the-web
    title: On the web
    caption: Captures of the live site at kubb.thingelstad.xyz on the evening of November 15, 2026, the day it was built.
artifacts:
  - file: home.png
    bundle: on-the-web
    title: Home
    caption: 'KUBB over THROWING WOOD, “The lawn game of wooden blocks and batons, in your browser. Friends on one pitch, each on their own screen.”, and the three ways in: START A PITCH, PLAY THE COMPUTER and PRACTICE.'
    date: '2026-11-15'
  - file: wind-up.png
    bundle: on-the-web
    title: The wind-up
    caption: The practice pitch with the dial dragged back by a mouse, and the flag turned to FLICK! The target circle sits on the middle base kubb, and the minimap is bottom left.
    date: '2026-11-15'
  - file: tok.png
    bundle: on-the-web
    title: TOK!
    caption: The baton from that wind-up knocking a base kubb over, in slow motion, with TOK! bursting off the wood.
    date: '2026-11-15'
  - file: one-down.png
    bundle: on-the-web
    title: One down
    caption: The same throw a moment later, called 1 DOWN, with POWER ON, ARC ON and STEADY under it.
    date: '2026-11-15'
  - file: play-the-computer.png
    bundle: on-the-web
    title: Play the computer
    caption: The card that starts a match against the computer, on its own pitch, with a name, a level, and the match’s surface, opening, raising, wind and set of kubbs.
    date: '2026-11-15'
  - file: lobby-phone.png
    bundle: on-the-web
    title: Pick a side, on a phone
    caption: 'The lobby of a new pitch at its own link, on a phone-sized screen. Pat, a made-up player, has joined Team A in marigold as the host; Team B in violet is empty, so the computer plays that side. Up to six a side.'
    date: '2026-11-15'
---

Kubb: Throwing Wood on the web is the [Playdate game](/things/kubb-throwing-wood/) in a web browser. The Playdate game’s own code runs in it, unchanged: the geometry, the physics, the rules, the throwing order, the computer thrower and the [Planet Kubb Notation](/things/planet-kubb-score/). It is compiled as Lua 5.4 in WebAssembly, so the same throw gives the same result in every browser.

There are three ways to play. The home page starts a pitch at a random link. Friends who open the link arrive in a lobby, type a name and pick Team A or Team B, up to six a side, and the host starts the match. A side with no one on it is played by the computer. There is also a match against the computer alone, and an open practice pitch for throwing batons and drilling kubbs.

The Playdate’s crank is a dial here. A press on the dial and a drag round it, with a mouse or a finger, winds back; a swing forward and a let-go throws. The pointer’s motion feeds the same swing code the crank does, and the target circle is dragged on the pitch. In a shared match the thrower’s browser decides the throw and sends it, and every other browser replays it on its own copy of the pitch. While someone aims, everyone else watches the aim and the dial move, and a few shouts can be sent: NICE!, OOH! and TOK!

It wears the Playdate game’s Woodcut in colour: black outlines and hard shadows, a green pitch, Team A in marigold and Team B in violet, TOK! and KLAK! bursts, and the recorded knocks of wood. There are no accounts, and a room expires after 48 hours.

Jamie asked for the Playdate game on the web, the same game with something of the web added, and Claude built it in one day, November 15, 2026, while the Playdate game was at its release candidate. Jamie made the design calls that day: teams picked in a lobby, a match, the computer and an open pitch, Woodcut in colour, and live and listed. Scored drills, saved players and the games list stayed on the Playdate.
