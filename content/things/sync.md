---
title: Sync
summary: A page that shows what each of my systems holds right now, how far behind each hop between them runs, and a receipt for the newest item of each kind.
collection: Developer tools and systems
status: active
url: https://sync.thingelstad.xyz/
started: '2026-10-26'
topics:
  - automation
  - open-web
sources:
  - kind: github
    repository: jthingelstad/sync.thingelstad.xyz
    role: implementation
  - kind: website
    url: https://sync.thingelstad.xyz/
    role: website
  - kind: website
    url: https://sync.thingelstad.xyz/flows/
    role: reference
connections:
  - to: weekly-thing
    label: follows the newest issue of
    detail: The Weekly Thing feed names the newest issue, and the page follows it to the Librarian, to Thingy, and to Linking Things, showing where it has arrived and where it has not.
    source: https://sync.thingelstad.xyz/flows/#hop-7
  - to: wt-builder
    label: watches the sends of
    detail: Every send WT Builder makes is a hop on the map, to the website, the email, the audio and the Librarian. WT Builder publishes no receipt of its own yet, so those hops are measured from what the next system down holds.
    source: https://sync.thingelstad.xyz/flows/#hop-10
  - to: jamie-thingelstad-blog
    label: follows the newest post of
    detail: The blog's feed names the newest post, and the page checks that the Librarian has pulled it and that it has a card.
    source: https://sync.thingelstad.xyz/flows/#hop-11
  - to: another-thing
    label: follows the newest episode of
    detail: The podcast feed names the newest episode, and the page checks that the Librarian holds it and Thingy serves it.
    source: https://sync.thingelstad.xyz/flows/#hop-12
  - to: linking-things
    label: follows the newest link of
    detail: Linking Things says when a link was last saved and which issues it has joined, so the page can show the newest link reaching the Librarian and the newest issue reaching Linking Things.
    source: https://sync.thingelstad.xyz/flows/#hop-14
  - to: thingy
    label: checks what is served by
    detail: Each corpus the Librarian uploads carries the id of its newest item as metadata, and Thingy's health check names the corpus versions it was deployed against. When the two agree, Thingy serves what the Librarian holds.
    source: https://sync.thingelstad.xyz/flows/#hop-16
  - to: cards
    label: checks the newest post's card at
    detail: The newest post's share image is fetched from Cards, so the page knows the card is being drawn.
    source: https://sync.thingelstad.xyz/flows/#hop-20
  - to: things-ive-built
    label: reads the activity feed of
    detail: The registry's activity feed is one of the sources the Librarian pulls on a clock, and the page shows that hop beside the others.
    source: https://sync.thingelstad.xyz/flows/#hop-13
story:
  color: '#1a5eb6'
  introduction: Is the new issue in Thingy yet?
  engineering:
    - One AWS Lambda function on a half-hour EventBridge schedule reads a fact from each system and writes a scriptless HTML page, a status.json and a receipt per kind into a private S3 bucket that CloudFront serves.
    - It reads only what each system already publishes, such as feeds, the metadata on the Librarian's corpus objects in S3, Thingy's health check, and the Linking Things MCP server. A system that publishes nothing shows as "no fact yet" rather than a guess.
    - The hops themselves are a contract, a shared flows file that names every hop, what it moves, what starts it, the lag to expect and how to verify it. The page vendors the file and never invents a hop of its own.
    - Each hop reads fresh, moving, late, held or unknown. A hop with no fact at its source is measured from the next system down and says so.
    - The map is drawn at deploy time with Pele, the same renderer that draws the connection diagrams on this site, and coloured on each run by the worst status of the kinds a hop moves.
  stack:
    - Node
    - AWS Lambda
    - Amazon EventBridge Scheduler
    - Amazon S3
    - Amazon CloudFront
    - Pele
  source: https://sync.thingelstad.xyz/flows/
  sourceLabel: The map of the flows
  related:
    - thingy
    - weekly-thing
    - linking-things
  started: Live since October 26, 2026
  questions:
    - Is the newest Weekly Thing in Thingy yet?
    - Which hop between my systems is running late?
    - What does each system hold right now?
artifacts:
  - file: sync-map.png
    title: The map, the first evening
    caption: Every hop between my systems on October 26, 2026, coloured by its state. Weekly Thing 354 had reached the Librarian and Thingy and had not reached Linking Things, the gap the page was built to show.
    date: '2026-10-26'
    source: https://sync.thingelstad.xyz/
  - file: sync-page.png
    title: The sync page
    caption: The page as it first went live, with its counts, the map, and the receipts for the newest issue, post, link, episode and audio edition.
    date: '2026-10-26'
    source: https://sync.thingelstad.xyz/
---

My writing moves through a lot of systems. An issue of the Weekly Thing is written in WT Builder, sent to the website, the email and the podcast feed, pulled into the Librarian, served by Thingy, and joined to the links it carried in Linking Things. A blog post goes from Micro.blog to the Librarian and gets a card. Most of the time it all works. When it doesn’t, the only way to know was to go and look. The question that started this was a simple one: is the new issue available in Thingy yet?

The first step was a map. A single shared file now names every hop between the systems, what moves across it, what starts it, how long it should take, and how to check that it arrived. The second step was this page, which reads a fact from each system every half hour and shows, for the newest item of each kind, who has it and who does not. The page is public because it holds only ids and times, never a reader.

The first thing it showed me was a gap I already suspected. Linking Things learned which links an issue carried from a copy of the newsletter on my Mac, so Weekly Thing 354 had not joined its links. The page reads that hop as late and leaves it that way until the hop itself is fixed. That is the point: the page shows the state and does not touch anything.
