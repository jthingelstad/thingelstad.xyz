---
title: Road Sign Math Quiz
summary: 'Road Sign Math in a web browser: solve the signs other players found and photographed, one at a time, with the same account as the iPhone app.'
tagline: 'Solve the road signs other players posted, in a web browser.'
collection: Games
status: active
url: https://quiz.roadsignmath.xyz/
started: '2026-11-11'
topics:
  - play
sources:
  - kind: website
    url: https://quiz.roadsignmath.xyz/
    role: website
  - kind: github
    repository: jthingelstad/roadsignmath.xyz
    path: src/quiz
    role: implementation
  - kind: website
    url: https://roadsignmath.xyz/privacy
    role: reference
connections:
  - to: road-sign-math-2026
    label: plays the signs of
    detail: Quiz shows the signs posted from the iPhone app, and a player signs in with the same Road Sign Math account. A way found in Quiz goes on the sign for everyone, in the app and on roadsignmath.xyz.
    source: https://roadsignmath.xyz/privacy
story:
  color: '#006348'
  introduction: Find the math in a road sign.
  engineering:
    - The pages are drawn on the server with Hono’s JSX, by the same Lambda function as roadsignmath.xyz, behind a CloudFront distribution of its own that caches nothing and keeps its own access log. Each distribution tells the function which front it is with a header CloudFront sets.
    - The keypad holds the sign’s numbers as tiles and keys for the operators, with no digit keys. Every tap is checked in the browser by the same equation checker the server runs, bundled from its TypeScript. Without JavaScript the keypad is a plain text field, and the server checks what is sent.
    - A way goes through the same rules as one sent from the app. A new way goes on the sign. The first way on a sign posted with no math earns the Tag Team badge, for the solver and for the sign’s poster. Math that matches another player’s way adds the solver to “Also found by” and earns no badge, and the same numbers with the terms swapped earn nothing.
    - The next sign is drawn at random from the shown signs whose numbers do not credit the player and that the player has not solved, so no one is quizzed on their own signs. Skip records nothing.
    - Signing in is the app’s, by email with a six-digit code or a link and no password, and a new player gives a name. One HttpOnly cookie holds the sign-in.
    - Quiz counts its pages in a Tinylytics site of its own, apart from the website’s. Each sign page on roadsignmath.xyz links “Try this one in Quiz”, and signing in on the way lands on that sign.
  stack:
    - TypeScript
    - Hono
    - AWS Lambda
    - CloudFront
  source: https://quiz.roadsignmath.xyz/
  sourceLabel: Solve a sign
  related:
    - road-sign-math-2026
    - road-sign-math
  started: Opened November 12, 2026
  questions:
    - How does Quiz choose the next sign I solve?
    - What happens when my math matches someone else’s way?
    - Does Quiz work without JavaScript?
bundles:
  - id: playing
    title: Playing it
    caption: Quiz on a local copy of the server on the night of November 11, 2026, while it was being built and before it opened, signed in as Pat, a made-up player.
  - id: on-the-website
    title: On the website
    caption: Where Quiz meets roadsignmath.xyz, on the same local copy, November 11 and 12, 2026.
artifacts:
  - file: home.png
    bundle: playing
    title: Home
    caption: '“Find the math in a road sign.” Tyler’s I-35W at 82nd Street sign with its eight numbers as tiles, how it works in three steps, and three more signs, with a button to sign in to play.'
    date: '2026-11-11'
  - file: solve.png
    bundle: playing
    title: Solving a sign
    caption: The Brandon, Iowa sign from October 2005, with 48 + 1 tapped in so far. The keypad has the sign’s three numbers and the operators, and no digit keys. It asks for an = so there are two sides.
    date: '2026-11-11'
  - file: turned-around.png
    bundle: playing
    title: Turned around
    caption: '“That’s Dave’s way, turned around.” Swapping the sides of a × or a + makes no new way, so the numbers are back for another try.'
    date: '2026-11-11'
  - file: found-it-too.png
    bundle: playing
    title: Found it too
    caption: 'Pat’s math matches Dave Oosterhuis’s way on the Brandon sign, 48 + 1 = 49, so the way now reads Found by Dave Oosterhuis, also found by Pat.'
    date: '2026-11-11'
  - file: signs-solved.png
    bundle: playing
    title: Signs you’ve solved
    caption: The list only the player sees, with the Brandon sign marked “You found it too”, and a link to the player’s public page on roadsignmath.xyz.
    date: '2026-11-11'
  - file: player-page.png
    bundle: on-the-website
    title: A Quiz player’s page
    caption: 'Pat’s page on roadsignmath.xyz: “Finds the math in other players’ signs with Quiz”, and a way also found on Randy Weiss’s Arlington Bell Tower sign.'
    date: '2026-11-11'
  - file: try-in-quiz.png
    bundle: on-the-website
    title: Try this one in Quiz
    caption: The box on a sign page that offers another way to make it true, in the app or in a browser with Quiz.
    date: '2026-11-12'
---

Road Sign Math Quiz is Road Sign Math in a web browser. The [iPhone app](https://thingelstad.xyz/things/road-sign-math-2026/) is where a sign is found, photographed and posted. Quiz is where anyone with a browser can solve the signs other players posted: one sign at a time, with its photo, its place and its numbers. The math is the player’s to find.

The next sign is drawn at random from the ones the player has not solved yet, and never from their own. The keypad holds only that sign’s numbers, as tiles, and the operators, and it checks the math with every tap. Skip records nothing.

A way goes through the same rules as one from the app. A new way goes on the sign for everyone. The first way on a sign that was posted with no math earns the Tag Team badge, and so does the sign’s poster. Math that matches a way someone already found adds the player to “Also found by”. The same way with its terms swapped earns nothing, and Quiz says so: “That’s Dave’s way, turned around.” There are no points, scores, streaks, timers, totals or ranks. The signs a player has solved are a list only they see, and when every sign is done there is a page for that.

Quiz uses the same account as the app, signed in by email with a code or a link. It was decided and designed on November 11, 2026, when a Claude Design session drew its boards. It was built overnight, from the 11th to the 12th, switched off until it was ready, and opened to everyone on November 12. It lives in the same open source repository as [roadsignmath.xyz](https://github.com/jthingelstad/roadsignmath.xyz), and each sign page there has a button to try that sign in Quiz.
