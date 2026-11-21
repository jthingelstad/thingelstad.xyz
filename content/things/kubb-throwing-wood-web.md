---
title: 'Kubb: Throwing Wood on the web'
site_name: 'Kubb: Throwing Wood'
summary: 'The Playdate game Kubb: Throwing Wood in a web browser: a match on a link with friends, a match against the computer, or the practice pitch, thrown with a dial or a linear meter in place of the crank. Anyone can watch an open game and move the camera round the pitch. It runs the Kubb Engine, and a phone running the iPhone game can join its pitches.'
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
gadget:
  title: Watch a match
  summary: A kept match from the game on the web, replayed throw by throw from its recorded actions, in a frame from throwingwood.com.
story:
  color: '#3f7a2e'
  introduction: Friends on one pitch, each on their own screen.
  engineering:
    - The Kubb Engine, the Playdate game’s Lua core with a session and a room around it, runs unchanged in the browser, compiled as Lua 5.4 in WebAssembly with wasmoon, so the same throw gives the same result in every browser. It is copied in from tagged releases, three of them since November 20, 2026, and each match is played, replayed and drawn on the engine it began on.
    - The crank is a dial, or a straight linear meter, the player’s choice. A press and a drag winds back, a swing forward and a let-go releases, and the pointer’s motion feeds the same swing code the crank does. On a touchscreen the finger works beside the control, never on it.
    - In a shared match the browser of whoever throws decides the throw and sends the launch. Every other browser replays it on its own copy of the pitch and checks a hash of the match. While someone aims, the others watch their aim and their dial move.
    - The room server is small and knows no Kubb, an API Gateway WebSocket API with one Lambda function and DynamoDB. There are no accounts, and a room expires after 48 hours.
    - A highlight reel is made on the server by a Lambda function that plays a finished match’s kept replay through the engine, draws its best throws frame by frame and encodes them with ffmpeg, as a tall video and a wide one.
    - A scene is a look only. The engine keeps a match’s scene as a name and never reads it, so a throw goes the same way, to the same hash, in every scene. Everything that draws a match, the game, its replay, the embed and the reel on the server, draws it through one stage that takes that name, and a name the browser does not know is drawn as the day.
    - The free camera is an orbit round a point on the pitch, made with the same lookAt arithmetic as the engine’s own camera, so every scene draws through it as through any other. It keeps the wide view’s lens, so closer means the eye moving, and it is off in the thrower’s view, which follows each throw.
    - The site is static, on S3 behind CloudFront, drawn with JavaScript on a canvas.
  stack:
    - Lua 5.4
    - WebAssembly
    - JavaScript
    - API Gateway
    - AWS Lambda
    - DynamoDB
    - CloudFront
  source: https://throwingwood.com/web/
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
  - id: a-home-for-the-game
    title: A home for the whole game
    caption: Captures of the live site on the afternoon of November 20, 2026, at version 0.5.0 (0.9.0), taken for this page by a browser 1280 pixels wide, and 500 for the narrow one. The Playdate page was taken later the same afternoon, at version 0.7.0 (0.9.0).
  - id: scenes
    title: Night and Neon
    caption: Captures of the live site in the late afternoon of November 20, 2026, at version 0.7.0 (0.9.0), taken for this page by a browser 1280 pixels wide. Each scene was picked with the address’s scene switch, which the game keeps for links and testing.
  - id: watching
    title: Watching, and the free camera
    caption: Captures of version 0.8.0 (0.9.0) on the night of November 20, 2026, drawn by the site’s own browser tests against a room server on the same machine, 1280 pixels wide. The match is the computer against itself, North against South. The open games list is one part of the web game’s page.
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
  - file: landing.png
    bundle: a-home-for-the-game
    title: The front page
    caption: 'KUBB over THROWING WOOD, “Throw sticks of wood at blocks of wood. Knock them all over, then topple the king.”, PLAY NOW, and buttons for the iPhone and Playdate games under it. Further down are three ways to play, a pitch as a link, watching a match again, why it feels right and kubb clubs to find, and the foot of the page reads Version 0.5.0 (0.9.0).'
    date: '2026-11-20'
    source: https://throwingwood.com/
  - file: landing-narrow.png
    bundle: a-home-for-the-game
    title: The front page, narrow
    caption: The top of the same page at 500 pixels wide, with PLAY NOW, IPHONE AND IPAD and PLAYDATE above a TOK! from the game.
    date: '2026-11-20'
    source: https://throwingwood.com/
  - file: web-page.png
    bundle: a-home-for-the-game
    title: The web game’s page
    caption: 'The old home page at its new address, /web/: START A PITCH, who can join, and PLAY THE COMPUTER, WATCH THE COMPUTER and PRACTICE.'
    date: '2026-11-20'
    source: https://throwingwood.com/web/
  - file: practice-0.5.0.png
    bundle: a-home-for-the-game
    title: The practice pitch on 0.5.0
    caption: Five base kubbs, the clock at rest, and the coach line PULL BACK TO THE ORANGE MARK over WIND BACK. TILT and ARC are sliders with the engine’s ticks under them, beside STAND and SIDE VIEW.
    date: '2026-11-20'
    source: https://throwingwood.com/practice/
  - file: playdate-page.png
    bundle: a-home-for-the-game
    title: The Playdate game’s page
    caption: IN DEVELOPMENT, On Playdate, “This is where the game began.”, and GET THE TEST BUILD, beside the game’s reel from the Playdate Simulator, at the first HOW TO PLAY card, THE PITCH. Further down the page are the crank, what there is to play, the download of test build 0.9.7 and the three steps to sideload it.
    date: '2026-11-20'
    source: https://throwingwood.com/playdate/
  - file: night-practice.png
    bundle: scenes
    title: Practice at night
    caption: The practice pitch under a full moon, with hills against a starry sky. The five base kubbs and the baseline glow pale green, the baton is lit at the thrower’s feet, and the clock, the sliders and the buttons are dark to match.
    date: '2026-11-20'
    source: https://throwingwood.com/practice/?scene=night
  - file: neon-practice.png
    bundle: scenes
    title: Practice in Neon
    caption: The same pitch as a black world on a grid of faint blue lines, the baseline a bright cyan line, the kubbs edged in violet light and the baton in pink. The controls take the scene’s cyan.
    date: '2026-11-20'
    source: https://throwingwood.com/practice/?scene=neon
  - file: scene-row.png
    bundle: scenes
    title: The Scene row
    caption: 'The Play the computer card, its last row SCENE: Day, Night and Neon, each with a small picture of its scene. Night is picked, and the card and the pitch behind it already wear it. Nothing was started; the card was only opened.'
    date: '2026-11-20'
    source: https://throwingwood.com/web/
  - file: open-games.png
    bundle: watching
    title: JOIN or WATCH
    caption: 'Open games, “These pitches are open to anyone. Join one and pick a side, or watch a match.”, and one row: 2 of 12 on the pitch, in play, made just now, with JOIN and WATCH.'
    date: '2026-11-20'
    source: https://throwingwood.com/web/
  - file: watch-wide.png
    bundle: watching
    title: The wide view, as it begins
    caption: The whole pitch from high on the sideline, with North to throw. Low on the left is the hint “Drag to look around. Scroll to zoom.”
    date: '2026-11-20'
    source: https://github.com/jthingelstad/kubb.thingelstad.xyz/pull/93
  - file: watch-moved.png
    bundle: watching
    title: The same pitch, moved
    caption: After a drag and a scroll the eye has turned round and come closer, looking along the center line past the king. RESET VIEW is low on the left.
    date: '2026-11-20'
    source: https://github.com/jthingelstad/kubb.thingelstad.xyz/pull/93
  - file: watch-neon-moved.png
    bundle: watching
    title: Moved, in Neon
    caption: The same moved view in Neon, the pitch’s lines in cyan light and the king lit pink at the center.
    date: '2026-11-20'
    source: https://github.com/jthingelstad/kubb.thingelstad.xyz/pull/93
---

Kubb: Throwing Wood on the web is the [Playdate game](/things/kubb-throwing-wood/) in a web browser. The Playdate game’s own code runs in it, unchanged: the geometry, the physics, the rules, the throwing order, the computer thrower and the [Planet Kubb Notation](/things/planet-kubb-score/). It is compiled as Lua 5.4 in WebAssembly, so the same throw gives the same result in every browser.

There are three ways to play. The home page starts a pitch at a random link. Friends who open the link arrive in a lobby, type a name and pick Team A or Team B, up to six a side, and the host starts the match. A side with no one on it is played by the computer. There is also a match against the computer alone, and an open practice pitch for throwing batons and drilling kubbs.

The Playdate’s crank is a dial here. A press on the dial and a drag round it, with a mouse or a finger, winds back; a swing forward and a let-go throws. The pointer’s motion feeds the same swing code the crank does, and the target circle is dragged on the pitch. In a shared match the thrower’s browser decides the throw and sends it, and every other browser replays it on its own copy of the pitch. While someone aims, everyone else watches the aim and the dial move, and a few shouts can be sent: NICE!, OOH! and TOK!

It wears the Playdate game’s Woodcut in colour: black outlines and hard shadows, a green pitch, Team A in marigold and Team B in violet, TOK! and KLAK! bursts, and the recorded knocks of wood. There are no accounts, and a room expires after 48 hours.

Jamie asked for the Playdate game on the web, the same game with something of the web added, and Claude built it in one day, November 15, 2026, while the Playdate game was at its release candidate. Jamie made the design calls that day: teams picked in a lobby, a match, the computer and an open pitch, Woodcut in colour, and live and listed. Scored drills, saved players and the games list stayed on the Playdate.

On November 16 a tester sent a report from inside it: six batons at one field kubb, and every one missed. A match here is kept as the actions its players sent, so this one could be replayed exactly, and the replay is kept until November 17, 2027. It is the match in [the gadget](#gadget).

On November 17 it moved to its own domain, [throwingwood.com](https://throwingwood.com/), and the old address sends visitors there. The same day the game’s core came out of the Playdate game as [the Kubb Engine](/things/kubb-engine/), with the session and the room that had been written for the web, and the web began carrying the engine from its tagged releases. Since that day [the iPhone game](/things/kubb-throwing-wood-iphone/) plays the same engine, so a phone and a browser can play opposite sides of one match. On November 18 it got a [privacy page](https://throwingwood.com/privacy/), shared with the iPhone game.

On November 19 its controls were remade for a hand, and the iPhone game took the same ones. The clock or [a linear meter](#artifact-hint-linear-phone.png), at the left or the right, is the player’s choice in [the menu](#artifact-menu.png). Jamie, that day: “I’m considering a player preference for a circular meter (clock) versus a linear meter ... The logic is the same to me. Just a choice if you want to spin your thumb or crank -- or use a different hand to flick” ([the site’s notes](https://github.com/jthingelstad/kubb.thingelstad.xyz/blob/main/docs/CLIENT.md)). A finger on a touchscreen turns the clock from beside it and draws the linear meter from low on the screen, so neither is covered. A player who has not managed a throw is [shown one on the meter](#artifact-hint-clock-phone.png), with a mark where to pull back to, and a coach line over the meter for the first few throws. The step buttons for the arc and the tilt became sliders, SIDE VIEW shows the planned arc from out over the thrower’s shoulder, and STAND, a drag on a picture of the line, replaced WALK. A kubb is raised by touching it, AUTO ALL raises the rest of a turn’s, and the menu can raise them for the rest of the game. SEND FEEDBACK takes a throw that looked wrong or anything else. And [a phone on its side](#artifact-phone-on-its-side.png) gets the wide layout, with the plan’s controls at the far edge and one shout at a time.

In the night of November 19 to 20, highlight reels went live. When a match on a shared pitch is over, a player can ask for one: a short video of its best throws, made on the server from the kept replay with the engine’s own physics, tall for a phone and wide for a screen. A match against the computer can be shared too, and then it gets a link of its own, its replay and a reel. Anyone with the link can watch them for a year. On November 20 batons came to be drawn plain, with no bands, in every set, and that afternoon the reel’s last card gained a QR code of the match’s link, in version 0.3.0.

Version 0.4.0, the same afternoon, made throwingwood.com the home of the whole game, not only of the web version. [The front page](#artifact-landing.png) says what kubb is and offers three ways to play. The game’s own page, the old home page, moved to [/web/](#artifact-web-page.png), and there are pages for the iPhone app, the Playdate game, the Kubb Engine and kubb clubs and sites to find. The words are short and plain on purpose. Pitch, replay and share links did not change.

Version 0.5.0 came early in the afternoon, on engine 0.9.0. It carries 0.8.2 and 0.7.4 beside it, so a match begun on an older engine plays and replays on that one, and a pitch shared with a phone that has only 0.8 plays on 0.8. On a 0.9 match the computer’s level is an option of the match, on the card that starts a match against the computer and in a pitch’s lobby, where the host sets it. A player’s own level is one setting, in MENU. ARC, TILT and SPIN are [sliders that stop anywhere](#artifact-practice-0.5.0.png). And the foot of every page shows the version as 0.5.0 (0.9.0), the site’s own and then the engine’s.

Version 0.6.0 followed an hour later. [The page for the Playdate game](#artifact-playdate-page.png) stands on its own now: the game’s reel plays near the top, and the download and the three steps to sideload it are on the page, from the Playdate games site’s own files. The landing pages gained a newsletter sign-up, News from the pitch, a plain form that posts the address to Buttondown and keeps nothing on the site. A robots.txt keeps crawlers off each match’s own addresses and lets the fetchers that draw link previews in, so a shared link still shows its card. The privacy page and /web/ say it plainly: “Matches are recorded to help make the game better.” And the engine’s page counts its golden hashes from the engine it carries, 523 for 0.9.0, where it had said 505.

Version 0.7.0, an hour after that, brought scenes. A match can be played in the Day, as every match was before; at [Night](#artifact-night-practice.png), on a real pitch under a full moon, with stardust behind a thrown baton; or in [Neon](#artifact-neon-practice.png), a black world on a grid of light. A scene is a look only, with the same engine and the same throws, and it skins the controls too, so the clock, the sliders and the cards go dark with the pitch. It is a row on [the Play the computer card](#artifact-scene-row.png), with a small picture of each scene, a row in practice’s MENU, and, on a shared pitch on engine 0.9, a row in the lobby, where the host picks for everyone. A replay, an embed and a highlight reel draw a match in its own scene. With reduced motion a scene keeps its look and drops what moves on its own. Every scene’s type is held to a contrast of 7:1 or better, and the night costs about 28 milliseconds a frame where the day costs about 20, measured with the processor slowed four times ([the site’s notes on scenes](https://github.com/jthingelstad/kubb.thingelstad.xyz/blob/main/docs/SCENES.md)).

Version 0.7.1 came that night and sorted the settings by whom they belong to. The device’s own settings are one set of rows, Your name, Your level, Meter, Meter side and Sound, in the game’s MENU and on a new page, /settings/, linked from /web/. A name is typed once and kept on the device, and a match against the computer and a shared pitch both use it. The card that starts a match against the computer and the lobby show one You row, such as “Birch · Throwing at Club.”, with one CHANGE IN MENU button. Raising, by hand or automatic, is now the match’s choice and no longer a row in MENU.

Version 0.8.0 followed half an hour later, with observer mode and a free camera. Jamie asked for it: “I want to allow an observer to view open games that people are playing” ([the site’s notes on watching](https://github.com/jthingelstad/kubb.thingelstad.xyz/blob/main/docs/OBSERVER.md)). Beside JOIN on [the open games list](#artifact-open-games.png) there is now WATCH. An observer is in step at once, even in the middle of a match, and the lobby’s Watching line names it. It can never throw or act, never becomes the host and cannot shout. Anyone who watches in the wide view can move the camera: an observer, a player who watches instead, someone watching the computer, or a replay. A mouse, a finger or the keys turn round the pitch, tilt the view, move over it and zoom; on a touchscreen one finger turns, and two fingers pinch, twist and slide. [A moved view](#artifact-watch-moved.png) has RESET VIEW to go back to [where it began](#artifact-watch-wide.png). The eye stays 2.5 to 24 meters from the point it looks at and never under 0.35 meters, looks down 86 degrees at most, and keeps the horizon level. Nothing about the view is stored. It works in every scene, [Neon](#artifact-watch-neon-moved.png) too, and it needed no change to the engine or the room server. The foot of every page reads 0.8.0 (0.9.0).
