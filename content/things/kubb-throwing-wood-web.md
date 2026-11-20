---
title: 'Kubb: Throwing Wood on the web'
site_name: 'Kubb: Throwing Wood'
summary: 'The Playdate game Kubb: Throwing Wood in a web browser: a match on a link with friends, a match against the computer, or the practice pitch, thrown with a dial or a linear meter in place of the crank. It runs the Kubb Engine, and a phone running the iPhone game can join its pitches.'
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
  - kind: github
    repository: jthingelstad/kubb.thingelstad.xyz
    role: implementation
  - kind: website
    url: https://throwingwood.com/privacy/
    role: reference
connections:
  - to: kubb-engine
    label: runs
    detail: The engine’s core, session and room, copied in from a tagged release byte for byte and checked file by file. The web’s WebAssembly Lua is the reference every other copy of the engine is measured against.
    source: https://github.com/jthingelstad/kubb.thingelstad.xyz
  - to: kubb-throwing-wood
    label: is the Playdate game, in a browser
    detail: The Playdate game’s own Lua core, its geometry, physics, rules, throwing order, computer thrower and notation, runs unchanged in the browser, since November 17, 2026 as the Kubb Engine. The dial stands in for the crank, and the look is the game’s Woodcut in colour.
    source: https://throwingwood.com/
face: tok.png
story:
  color: '#3f7a2e'
  introduction: Friends on one pitch, each on their own screen.
  engineering:
    - The Kubb Engine, the Playdate game’s Lua core with a session and a room around it, runs unchanged in the browser, compiled as Lua 5.4 in WebAssembly with wasmoon, so the same throw gives the same result in every browser. It is copied in from a tagged release, and the menu says which.
    - The crank is a dial, or a straight linear meter, the player’s choice. A press and a drag winds back, a swing forward and a let-go releases, and the pointer’s motion feeds the same swing code the crank does. On a touchscreen the finger works beside the control, never on it.
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
    - kubb-engine
    - kubb-throwing-wood
    - kubb-throwing-wood-iphone
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
  - id: made-for-touch
    title: Made for a hand
    caption: Captures of the practice pitch on November 19, 2026, from the site’s code that day, drawn by its own tests and a browser on this page’s behalf, at a phone’s size and a laptop’s. The marks on the meter are a ghost of the throw the game is showing.
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
  - file: hint-clock-phone.png
    bundle: made-for-touch
    title: The hint, on a phone
    caption: A player who has not managed a throw is shown one on the clock, a ghost of the knob winding back and flicking, and a ghost fingertip on a track round the outside of the ring, where a finger can turn it without covering it. The flag says FLICK!
    date: '2026-11-19'
  - file: hint-linear-phone.png
    bundle: made-for-touch
    title: The hint, on the linear meter
    caption: The same hint on the linear meter at the screen’s edge, the ghost fingertip low on the screen where a finger draws the knob back without covering the track. The flag says FLING!
    date: '2026-11-19'
  - file: hint-clock-mouse.png
    bundle: made-for-touch
    title: The hint, with a mouse
    caption: On a laptop the ghost is a mouse pointer on the clock’s knob.
    date: '2026-11-19'
  - file: phone-on-its-side.png
    bundle: made-for-touch
    title: A phone on its side
    caption: A phone turned on its side gets the wide layout. TILT, STAND, ARC and SIDE VIEW sit at the far edge for one hand, the minimap beside them, and the clock low on the other side for the throwing hand.
    date: '2026-11-19'
  - file: menu.png
    bundle: made-for-touch
    title: The menu
    caption: YOUR LEVEL, METER (Clock or Linear), METER SIDE (Left or Right), SURFACE and SOUND, then HOW TO THROW, SEND FEEDBACK, RULES and HOME. The last line gives the site’s version, its build and the engine it ran when this was taken, 0.5.1; the site went live on engine 0.7.1 later that day.
    date: '2026-11-19'
---

Kubb: Throwing Wood on the web is the [Playdate game](/things/kubb-throwing-wood/) in a web browser. The Playdate game’s own code runs in it, unchanged: the geometry, the physics, the rules, the throwing order, the computer thrower and the [Planet Kubb Notation](/things/planet-kubb-score/). It is compiled as Lua 5.4 in WebAssembly, so the same throw gives the same result in every browser.

There are three ways to play. The home page starts a pitch at a random link. Friends who open the link arrive in a lobby, type a name and pick Team A or Team B, up to six a side, and the host starts the match. A side with no one on it is played by the computer. There is also a match against the computer alone, and an open practice pitch for throwing batons and drilling kubbs.

The Playdate’s crank is a dial here. A press on the dial and a drag round it, with a mouse or a finger, winds back; a swing forward and a let-go throws. The pointer’s motion feeds the same swing code the crank does, and the target circle is dragged on the pitch. In a shared match the thrower’s browser decides the throw and sends it, and every other browser replays it on its own copy of the pitch. While someone aims, everyone else watches the aim and the dial move, and a few shouts can be sent: NICE!, OOH! and TOK!

It wears the Playdate game’s Woodcut in colour: black outlines and hard shadows, a green pitch, Team A in marigold and Team B in violet, TOK! and KLAK! bursts, and the recorded knocks of wood. There are no accounts, and a room expires after 48 hours.

Jamie asked for the Playdate game on the web, the same game with something of the web added, and Claude built it in one day, November 15, 2026, while the Playdate game was at its release candidate. Jamie made the design calls that day: teams picked in a lobby, a match, the computer and an open pitch, Woodcut in colour, and live and listed. Scored drills, saved players and the games list stayed on the Playdate.

On November 17 it moved to its own domain, [throwingwood.com](https://throwingwood.com/), and the old address sends visitors there. The same day the game’s core came out of the Playdate game as [the Kubb Engine](/things/kubb-engine/), with the session and the room that had been written for the web, and the web began carrying the engine from its tagged releases. Since that day [the iPhone game](/things/kubb-throwing-wood-iphone/) plays the same engine, so a phone and a browser can play opposite sides of one match. On November 18 it got a [privacy page](https://throwingwood.com/privacy/), shared with the iPhone game.

On November 19 its controls were remade for a hand, and the iPhone game took the same ones. The clock or [a linear meter](#artifact-hint-linear-phone.png), at the left or the right, is the player’s choice in [the menu](#artifact-menu.png). Jamie, that day: “I’m considering a player preference for a circular meter (clock) versus a linear meter ... The logic is the same to me. Just a choice if you want to spin your thumb or crank -- or use a different hand to flick” ([the site’s notes](https://github.com/jthingelstad/kubb.thingelstad.xyz/blob/main/docs/CLIENT.md)). A finger on a touchscreen turns the clock from beside it and draws the linear meter from low on the screen, so neither is covered. A player who has not managed a throw is [shown one on the meter](#artifact-hint-clock-phone.png), with a mark where to pull back to, and a coach line over the meter for the first few throws. The step buttons for the arc and the tilt became sliders, SIDE VIEW shows the planned arc from out over the thrower’s shoulder, and STAND, a drag on a picture of the line, replaced WALK. A kubb is raised by touching it, AUTO ALL raises the rest of a turn’s, and the menu can raise them for the rest of the game. SEND FEEDBACK takes a throw that looked wrong or anything else. And [a phone on its side](#artifact-phone-on-its-side.png) gets the wide layout, with the plan’s controls at the far edge and one shout at a time.
