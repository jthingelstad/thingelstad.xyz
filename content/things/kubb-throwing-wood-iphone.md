---
title: 'Kubb: Throwing Wood for iPhone'
summary: 'Kubb: Throwing Wood as a native iPhone app, begun on November 17, 2026. It runs the Kubb Engine in Lua with musl’s math built in, so its throws match the web game’s hash for hash, and it plays on the same pitches. Since November 19 it plays on an iPad too, the same game on a bigger screen. It is in TestFlight with a small group of testers.'
collection: Games
status: active
url: null
started: '2026-11-17'
topics:
  - play
  - agents
sources:
  - kind: github
    repository: jthingelstad/throwingwood-ios
    role: implementation
  - kind: website
    url: https://throwingwood.com/privacy/
    role: reference
connections:
  - to: kubb-engine
    label: runs
    detail: The app carries a tagged release of the Kubb Engine byte for byte, in Lua 5.4 with musl’s math compiled in, and its tests play the engine’s golden matches and check every hash.
    source: https://github.com/jthingelstad/throwingwood-ios
  - to: kubb-throwing-wood-web
    label: plays on the same pitches as
    detail: A pitch link opens in the app, and a phone and a browser can play opposite sides of the same match.
    source: https://github.com/jthingelstad/throwingwood-ios/blob/main/docs/ONLINE.md
face: aim-clock.png
story:
  color: '#c85a1e'
  introduction: The web’s match, in the hand.
  engineering:
    - A SwiftUI app for iOS 26, in Swift with no third-party packages, built on the skeleton of the Road Sign Math app.
    - The game is the Kubb Engine, run in Lua 5.4.5, the Lua that wasmoon 1.16 builds. Apple’s math library differs from the web’s in the last bit on some arguments, so musl 1.2.5’s math is compiled in instead, with every name renamed so nothing falls back to Apple’s, and no fused multiply-adds.
    - The pitch is drawn with Core Graphics, in heavy ink frames with hard shadows, from what the engine reports after every action.
    - Online play is the web’s rooms service, spoken to over a Foundation WebSocket, so the app joins the same lobbies and the same matches as a browser.
    - The layout reads the window’s size, never the device’s. A window taller than 1.05 times its width is laid out upright and any other wide, so an iPad upright, on its side or in a resizable window gets one of the same two layouts as a phone.
    - Wood knocks on impact, and Core Haptics taps as the dial’s arm enters or leaves a target band and when the king falls; sound and haptics each have a switch.
  stack:
    - Swift
    - SwiftUI
    - iOS 26
    - iPadOS 26
    - Lua 5.4
    - musl
    - Core Graphics
    - TestFlight
  source: https://github.com/jthingelstad/throwingwood-ios
  sourceLabel: Read the app
  related:
    - kubb-engine
    - kubb-throwing-wood-web
    - kubb-throwing-wood
    - planet-kubb-score
  started: Begun November 17, 2026
  questions:
    - Can I play someone on the website from my iPhone?
    - Why does the app bring its own math library?
    - What is the difference between the clock and the linear meter?
bundles:
  - id: review-pictures
    title: The review pictures
    caption: Captures of the app in the iOS simulator on an iPhone 16e, from the pictures its repository keeps for review, with a match made up for them, on November 17 to 19, 2026. You and CPU, Maple and Birch are the pictures’ own names.
  - id: ipad-pictures
    title: On an iPad
    caption: Captures of the app in the iPadOS simulator on an iPad mini and an iPad Pro 13-inch, full screen, from the pictures its repository keeps for review, with a match made up for them, on November 19, 2026. You and CPU are the pictures’ own names.
artifacts:
  - file: aim-clock.png
    bundle: review-pictures
    title: Aiming, with the clock
    caption: The first turn of a match against the computer. The clock is the meter, wound back on the left and stopped on the blue mark, with ARC and SIDE VIEW on one side of it and TILT and STAND on the other.
    date: '2026-11-19'
  - file: aim-linear.png
    bundle: review-pictures
    title: Aiming, with the linear meter
    caption: The same throw with the linear meter, the clock unrolled into a track at the screen’s edge. Draw the knob back to the orange mark and fling it up to the blue one. Which meter, and which edge, is the player’s choice in the menu.
    date: '2026-11-19'
  - file: hint-clock.png
    bundle: review-pictures
    title: The hint, on the meter
    caption: A player who has not managed a throw is shown one on the meter itself, a ghost of the knob pulling back, holding and flicking, with a ghost fingertip beside the ring where a finger can turn it without covering it.
    date: '2026-11-19'
  - file: coach.png
    bundle: review-pictures
    title: The coach line
    caption: PULL BACK TO THE ORANGE MARK, over the meter’s own WIND BACK, for a phone that has thrown fewer than three times.
    date: '2026-11-19'
  - file: stand.png
    bundle: review-pictures
    title: STAND
    caption: The plate shows the throwing line from above with a ring where the thrower stands. Dragging it moves the thrower, and the caption says where to, 1.5 meters right and 2.1 back here.
    date: '2026-11-19'
  - file: on-its-side.png
    bundle: review-pictures
    title: On its side
    caption: The phone turned on its side lays the match out as the web’s wide screen. TILT, STAND, ARC and SIDE VIEW sit at the far edge for the left hand, and the clock low on the right for the throwing hand.
    date: '2026-11-19'
  - file: raise-by-touch.png
    bundle: review-pictures
    title: Raising by touch
    caption: A fallen field kubb being raised. Touch it, or drag it toward an end, to stand it there; AUTO lets the engine choose, and the menu’s Raising does it for the rest of the game.
    date: '2026-11-19'
  - file: score-sheet.png
    bundle: review-pictures
    title: The score sheet
    caption: A finished match against the computer in Planet Kubb Notation, written by the engine. Each team here is one player, so the throws carry no player’s name.
    date: '2026-11-19'
  - file: pitch-lobby.png
    bundle: review-pictures
    title: A pitch lobby
    caption: A shared pitch at its own throwingwood.com link, with SHARE and COPY to send it, a team each side, and the match’s surface, opening, raising, wind and kubbs.
    date: '2026-11-17'
  - file: send-feedback.png
    bundle: review-pictures
    title: Send feedback
    caption: The card that sends a report about a throw that looked wrong, or anything else, in one box. It says what goes with it, and that it is kept privately.
    date: '2026-11-19'
  - file: ipad-upright.png
    bundle: ipad-pictures
    title: An iPad mini, upright
    caption: The first turn of a match against the computer on an iPad mini held upright. It is the phone’s upright layout with more pitch around it, the clock in the middle, ARC and SIDE VIEW on one side and TILT and STAND on the other.
    date: '2026-11-19'
  - file: ipad-on-its-side.png
    bundle: ipad-pictures
    title: An iPad Pro 13-inch, on its side
    caption: The first turn again, on an iPad Pro 13-inch on its side, in the web’s wide layout. The clock grows with the screen, low on the right for the throwing hand, and TILT, STAND, ARC and SIDE VIEW sit at the far left with the minimap beside them.
    date: '2026-11-19'
  - file: ipad-linear-left.png
    bundle: ipad-pictures
    title: The linear meter on the left
    caption: An iPad mini on its side with the linear meter chosen at the left edge, at its full length, and the plan’s controls mirrored to the far right.
    date: '2026-11-19'
  - file: ipad-punishment-kubb.png
    bundle: ipad-pictures
    title: A punishment kubb
    caption: Placing a punishment kubb on an iPad Pro 13-inch on its side. The card keeps the web’s width in the corner instead of stretching across the screen; drag or tap a spot clear of the red circles, then PLACE IT.
    date: '2026-11-19'
---

Kubb: Throwing Wood for iPhone is the game Jamie began on the Playdate, made for a phone. It plays practice, a match against the computer, and matches on a shared pitch with friends, and a phone and a browser can play opposite sides of the same match. At the end of a match the score sheet is there in [Planet Kubb Notation](/things/planet-kubb-score/), with a rematch a button away.

It is native, written in Swift, but the game in it is not new code. It runs [the Kubb Engine](/things/kubb-engine/), the same Lua the [Playdate game](/things/kubb-throwing-wood/) and [the game on the web](/things/kubb-throwing-wood-web/) run, copied in from a tagged release. For a phone and a browser to share a match, every throw has to land in the same place on both, to the last bit. The web’s Lua runs in WebAssembly with musl’s math library, and Apple’s differs from it in the last digit on some numbers, so the app compiles musl’s math into its own Lua and uses nothing of Apple’s for it. Its tests play the engine’s golden matches and check every hash.

It was begun on November 17, 2026, the day the engine came out of the Playdate game. That day it ran the engine natively, hash for hash with the web, and played practice throws; on November 18 it played a whole match against the computer, started, joined and watched pitches online, opened pitch links, and knocked wood with sound and haptics. The same day it went into TestFlight with a small group of testers.

On November 19 it took on, alongside the web game, the controls the two now share. The meter is the player’s choice, the clock or a linear meter at either edge, and a finger turning either one no longer has to cover it. A player who is stuck is shown the throw on the meter itself. ARC and TILT are sliders, STAND replaced WALK, a kubb is raised by touching it, AUTO ALL raises the rest of a turn’s and the menu’s Raising the rest of the game’s, and Send Feedback takes any kind of feedback. The score sheet names a player only on a team of more than one. And the phone can be turned on its side. Jamie, that day: “Given we have a widescreen view for web, can we extend that to support iPhone rotated display?” And: “in landscape the tilt, arc, stand controls should be pushed to the left hand side of the screen so the user can control those with the left hand and the throw with the right hand” ([the app’s notes](https://github.com/jthingelstad/throwingwood-ios/blob/main/docs/RENDER.md)). Both are in it.

Later that day it became an iPad app as well. Jamie: “The idea of an iPad version would just be to give us a little bit bigger screen” ([the app’s notes](https://github.com/jthingelstad/throwingwood-ios/blob/main/docs/RENDER.md)). So [the iPad](#artifacts-ipad-pictures) plays the same game, with the same throw and the same cards, and nothing is drawn for it that the phone lacks. The layout goes by the window, not the device: [upright](#artifact-ipad-upright.png) is the phone’s layout, and [on its side](#artifact-ipad-on-its-side.png) or in a resizable window it is the web’s wide one, with TILT, ARC and STAND at the far edge from the meter. An iPad turns all four ways; the iPhone keeps three. On its side the clock takes the web’s rule for its size, so it grows with the screen, while the score sheet, the panels and the feedback card keep the web’s widths instead of stretching, and in a window smaller than the screen the turn rail keeps clear of the window’s own controls. Its tests sweep every window size an iPad can give, and it was checked in the simulator on an iPad mini and an iPad Pro 13-inch. Build 90 took it to the testers that evening; build 80, earlier the same day, had carried the phone on its side and the new controls.

Its bundle id is `com.throwingwood.app`, at the game’s own domain, and its privacy page is [on throwingwood.com](https://throwingwood.com/privacy/). Every upload to TestFlight, and the App Store, is Jamie’s call.
