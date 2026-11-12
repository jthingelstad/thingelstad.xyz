---
title: Terabyte Server
summary: 'The home server Jamie built in 2004 with 1.4 terabytes of RAID storage. It held the family’s music, ripped from nearly 1,000 CDs plus the vinyl, and for a while it also served thingelstad.com.'
collection: Historical projects
status: retired
url: https://www.thingelstad.com/2004/04/02/project-terabyte.html
started: '2004'
topics:
  - archives
  - making
sources:
  - kind: website
    url: https://www.thingelstad.com/2004/04/02/project-terabyte.html
    role: reference
  - kind: website
    url: https://www.thingelstad.com/2004/02/13/got-gig.html
    role: reference
  - kind: website
    url: https://www.thingelstad.com/2004/06/26/music-nirvana-achieved.html
    role: reference
  - kind: website
    url: https://www.thingelstad.com/2005/01/30/thingelstadcom-server-rebuilt.html
    role: reference
  - kind: website
    url: https://www.thingelstad.com/2007/12/30/western-digital-tb.html
    role: reference
connections:
  - to: jamie-thingelstad-blog
    label: served
    detail: When Jamie rebuilt the server in January 2005, thingelstad.com went down with it.
    source: https://www.thingelstad.com/2005/01/30/thingelstadcom-server-rebuilt.html
artifacts:
  - file: the-parts.jpg
    title: The parts on the table
    caption: The 3ware Escalade card in its box, six drives and the cables, before any of it met a case.
    date: '2004'
    source: https://www.thingelstad.com/2004/04/02/project-terabyte.html
  - file: escalade-card.jpg
    title: The Escalade 8506-8
    caption: The RAID card that started it. Its 64-bit, 66 MHz slot did not match Jamie’s motherboard, which was the first hiccup.
    date: '2004'
    source: https://www.thingelstad.com/2004/04/02/project-terabyte.html
  - file: empty-chassis.jpg
    title: The empty chassis
    caption: The SuperMicro case from above, bought after the dual Xeons would not clear the drive bays of the old one.
    date: '2004'
    source: https://www.thingelstad.com/2004/04/02/project-terabyte.html
  - file: xeon-fans-rear.jpg
    title: The board going in
    caption: The server board in the chassis, with the two Xeon fans standing well above it.
    date: '2004'
    source: https://www.thingelstad.com/2004/04/02/project-terabyte.html
  - file: xeon-heatsinks.jpg
    title: Two Xeons
    caption: The heatsinks and their fans. Each cooling assembly bolts through to the case, because it is too heavy for the motherboard alone.
    date: '2004'
    source: https://www.thingelstad.com/2004/04/02/project-terabyte.html
  - file: over-the-board.jpg
    title: A part over the board
    caption: A hand and a wired part, held above the memory slots and the Xeons.
    date: '2004'
    source: https://www.thingelstad.com/2004/04/02/project-terabyte.html
  - file: wired-up.jpg
    title: Wired up
    caption: The side off and the cabling in.
    date: '2004'
    source: https://www.thingelstad.com/2004/04/02/project-terabyte.html
  - file: the-chassis.jpg
    title: The finished tower
    caption: The door open on the hot-swap bays, one carrier partly out. It lived in the laundry room.
    date: '2004'
    source: https://www.thingelstad.com/2004/04/02/project-terabyte.html
---

The Terabyte Server, which Jamie also called Teraserver, was the home server he built in early 2004. He [announced it](https://www.thingelstad.com/2004/02/13/got-gig.html) at the end of a post about putting gigabit networking in the house: “The next Geek Fest will be the installation of over a terabyte of disk in the home server.”

[The build post](https://www.thingelstad.com/2004/04/02/project-terabyte.html) gives three reasons: the music collection, five years of digital photos, and the third, which he called the most important: “it seems that it’s relatively easy now and I wanted to try it. (This is where I was wrong.)”

The plan was a 3ware Escalade 8506-8 RAID card and six Western Digital 200GB SATA drives. Four numbered “minor hiccups” followed. The card did not fit his motherboard, so he bought an Asus PU-DL server board, 1GB of ECC RAM and two 2.4 GHz Xeons. The Xeons did not clear the drive bays of his Antec case, so he bought a SuperMicro SC742T-550 chassis. The power connectors then came up six inches short, and the first extension cable he ordered was not a straight-through. With the right one, “the server roared (literally! 4 fans and 7 hard drives!) to life.” It held 1.4 terabytes of disk, about one terabyte usable. His verdict: “a terabyte isn’t reasonable yet for the average home user.”

Then came the music. By [June 26, 2004](https://www.thingelstad.com/2004/06/26/music-nirvana-achieved.html) he had ripped and tagged nearly 1,000 CDs, then ripped, split and tagged his records too, and he called the project complete.

It also hosted thingelstad.com. Jamie [rebuilt it](https://www.thingelstad.com/2005/01/30/thingelstadcom-server-rebuilt.html) over a weekend in January 2005, which took the site down, and filled all eight ports on the card: a RAID1 mirror for the system, about 800GB of RAID5, and a hot spare. The carrier only held seven drives, so the eighth was mounted in the case. Then it went back to the laundry room. “Man is this thing loud!”

By [December 2007](https://www.thingelstad.com/2007/12/30/western-digital-tb.html) he could buy one terabyte on a single disk at the Apple Store. He looked back on the build, which “cost a little over $3,000 and was painful,” and on the new drive: “Surely a lot easier than building a horrific box with 8 SATA drives. Ugh!”

Asked about it in 2026, he called the build mostly an experiment: [“could I get that much storage into my home server? Sure enough, I did.”](https://thingelstad.xyz/interviews/session-7/#q44) The laundry room held more than the one machine. [“I had a standalone server rack, probably half a rack tall, and I had it all in there. Somehow I’d come across four or five blade servers, each 1U, so those were in there too.”](https://thingelstad.xyz/interviews/session-7/#q44) It was the time, he said, [“when I was still running all my own infrastructure at home”](https://thingelstad.xyz/interviews/session-7/#q44).
