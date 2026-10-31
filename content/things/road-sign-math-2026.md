---
title: Road Sign Math (2026)
summary: Road Sign Math rebuilt as an iPhone app that is the whole game, capturing a sign, reading its numbers, solving it and posting it, with roadsignmath.xyz as the place to see every sign on a map without the app.
collection: Games and communities
status: active
url: https://roadsignmath.xyz/
started: '2026-10-30'
topics:
  - play
sources:
  - kind: website
    url: https://roadsignmath.xyz/
    role: website
    sitemap: https://roadsignmath.xyz/sitemap.xml
  - kind: github
    repository: jthingelstad/roadsignmath.xyz
    role: implementation
  - kind: github
    repository: jthingelstad/roadsignmath-ios
    role: implementation
  - kind: website
    url: https://roadsignmath.xyz/privacy
    role: reference
connections: []
story:
  color: '#006348'
  introduction: Driving + Math = Fun.
  engineering:
    - The iPhone app is the whole game. It reads the numbers on a photo of a sign on the phone, with Apple’s Vision, boxes each one, and turns what it reads into numbers a player can use, so 82nd St is 82 and EXIT 7B is 7.
    - One equation checker is written in TypeScript for the server and ported to Swift for the app, and both pass the same test vectors. A way counts when its math is true and its numbers come from the sign. The math is kept as LaTeX and drawn with MathJax on the website and SwiftMath in the app.
    - The server is Node and Hono in a Lambda Web Function behind CloudFront, with DynamoDB for the signs and players, S3 for photos and SES for sign-in mail, released on every merge to main. Its API is described in OpenAPI 3.1.
    - Signing in is an email with a link or a six-digit code, with no password. Claude moderates posts, holding one only when it is clearly objectionable, looks at each profile photo first, and writes each photo’s alt text.
    - Badges are little road signs worked out from the signs each time they are read, so a badge follows its sign. There are no points, no counts and no ranks.
    - The website’s map is us-atlas’s Albers USA map, with each sign’s place projected and clustered on the server, so it needs no map provider. The app’s map is MapKit.
  stack:
    - Swift and SwiftUI
    - iOS 26
    - Vision
    - MapKit
    - TypeScript
    - Hono
    - AWS Lambda
    - DynamoDB
    - Claude
    - TestFlight
  source: https://roadsignmath.xyz/
  sourceLabel: See the signs
  related:
    - road-sign-math
    - road-sign-math-2021
  started: Played since 2005, rebuilt in 2026
  questions:
    - What does the Road Sign Math app do with a photo of a sign?
    - Why does Road Sign Math have badges but no points?
    - How does the Road Sign Math website draw its map without a map provider?
bundles:
  - id: the-app
    title: The iPhone app
    caption: The game from signing in to posting a sign, from October 30 and 31, 2026, the first two days of building it, on the simulator against a local copy of the server or the live one, with the 16 signs from the blog. The sample sign is one the app draws itself, for a simulator with no camera.
  - id: the-website
    title: The website
    caption: The new roadsignmath.xyz on October 31, 2026, where every sign posted from the app shows up, with no sign-in.
artifacts:
  - file: app-icon.png
    bundle: the-app
    title: The icon
    caption: 'The math from the Twin Lakes sign, √(5 − 1) = 2, on a green guide sign.'
    date: '2026-10-30'
    source: https://github.com/jthingelstad/roadsignmath-ios/pull/3
  - file: sign-in-email.png
    bundle: the-app
    title: The sign-in email
    caption: Under a “Driving + Math = Fun” sign, a button that signs in on the iPhone and a six-digit code to type instead. The code and link here are examples.
    date: '2026-10-30'
  - file: home.png
    bundle: the-app
    title: Home
    caption: 'The Latest feed, newest first: Tyler’s I-35W at 82nd Street sign from September 2025, its math, (90 − 82) ÷ 8 × 1 × 2 = 6 ÷ (10 − 7), and a button to find another way.'
    date: '2026-10-31'
  - file: map.png
    bundle: the-app
    title: The Map
    caption: The 16 signs as pins and clusters across North America, filtered by year, with a search for a town, a number or a person.
    date: '2026-10-30'
  - file: sign.png
    bundle: the-app
    title: A sign
    caption: '“On the way to the airport,” my sign from August 2025 near Burlington, Vermont: its photo, its math, (25 − 1) ÷ 8 = 4 − 3 ÷ 3, and the ways found so far.'
    date: '2026-10-30'
  - file: capture.png
    bundle: the-app
    title: Capture
    caption: The camera in Passenger mode, after a shot of the sample sign. Every number it read has a yellow box, and it says it got five.
    date: '2026-10-30'
  - file: check-the-numbers.png
    bundle: the-app
    title: Check the numbers
    caption: Every number the camera read on the I-35W sign, boxed in yellow on the photo and listed below to keep or drop. It read 12, including the 902 on the minivan’s plate.
    date: '2026-10-30'
  - file: fix-a-number.png
    bundle: the-app
    title: Checking the numbers
    caption: Fixing one number while checking what the camera read, with a close-up of where it read 82 in “82nd”. Letters next to a number are fine, so 7B counts as 7.
    date: '2026-10-30'
  - file: solve.png
    bundle: the-app
    title: Solving it
    caption: 'The math keypad on the sample sign, with roots, powers and factorials. (90 − 82) ÷ 8 = 1⁷ uses every number on the sign, and the app says “It works! Both sides make 1.”'
    date: '2026-10-30'
  - file: post-it.png
    bundle: the-app
    title: Post it
    caption: Naming the sign, with a suggested name, and its place, Bloomington, Minnesota, taken from the photo.
    date: '2026-10-30'
  - file: posted.png
    bundle: the-app
    title: Posted!
    caption: 'The sign is on the map and the website, and two new badges came with it, Square Root and States: 2.'
    date: '2026-10-30'
  - file: badges.png
    bundle: the-app
    title: Badges
    caption: The shelves of road-sign badges, Firsts and Places, each with how it is earned and, once it is, the day and the sign that earned it.
    date: '2026-10-30'
  - file: player-page.png
    bundle: the-app
    title: A player’s page, in dark mode
    caption: My page in the app, with 13 signs in 5 states since 2021, my badges, and my signs as photos.
    date: '2026-10-31'
  - file: find-another-way.png
    bundle: the-app
    title: Find another way
    caption: 'Writing a second way on Tyler’s I-35W sign: (90 − 82) × 2 = 10 + 6. It works, and three numbers sit this one out.'
    date: '2026-10-31'
  - file: profile-photo.png
    bundle: the-app
    title: A profile photo
    caption: Fitting a picture of a road and a sign into the circle that goes beside a player’s signs and on their page.
    date: '2026-10-31'
  - file: website-home.png
    bundle: the-website
    title: Home
    caption: '“Find a sign. Make the math true.” The map of every sign on the US, with a card for Minnesota’s two signs, and who’s playing: me, Tyler and Tammy.'
    date: '2026-10-31'
    source: https://github.com/jthingelstad/roadsignmath.xyz/pull/18
  - file: website-sign.png
    bundle: the-website
    title: A sign
    caption: 'Tyler’s I-35W at 82nd Street sign on the website: the photo, the math, the ways found so far, the numbers, a map pinned on the town, and nearby signs.'
    date: '2026-10-31'
  - file: website-player.png
    bundle: the-website
    title: A player’s page
    caption: My page on the website, with my badges and my signs on the map.
    date: '2026-10-31'
  - file: website-beta.png
    bundle: the-website
    title: Join the beta
    caption: The website’s section for the app, with a link to join the iPhone beta through TestFlight.
    date: '2026-10-31'
    source: https://github.com/jthingelstad/roadsignmath.xyz/pull/22
---

In October 2026 I rebooted Road Sign Math a third time, as an iPhone app that is the whole game. You photograph a sign from the passenger seat, the app boxes every number it can read, you check them, write your math on a keypad made for it, and post it. Everyone’s signs land on a feed, a map and a page for each player, and anyone can find another way to make a posted sign true. The first 16 signs are the ones from the blog, found by me, Tyler and Tammy from 2021 to 2025.

There are still no scores. I said so when we planned it: “The point system wasn’t a good idea. So I want to keep to the root which is a fun road trip game based on math and finding signs.” Instead there are badges, little road signs for a first sign, new states, a × in a way, all four seasons, and a few secrets.

roadsignmath.xyz is now the window onto the game for anyone without the app: the map of every sign, a page for each sign and each player, and no sign-in. It went live on October 30, 2026, replacing the blog, and on October 31 I submitted the app to Apple for a public TestFlight beta. Both the website and the app are open source.
