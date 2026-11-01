---
title: Weekly Thing
summary: 'Jamie’s weekend newsletter of links with commentary, sent since May 2017 and published as a website, email, and podcast.'
collection: Publishing
status: active
url: https://weekly.thingelstad.com/
started: '2017-05-13'
topics:
  - open-web
  - archives
sources:
  - kind: github
    repository: jthingelstad/weekly.thingelstad.com
    role: implementation
  - kind: website
    url: https://weekly.thingelstad.com/
    role: website
    sitemap: https://weekly.thingelstad.com/sitemap.xml
    feed: https://weekly.thingelstad.com/feed.xml
  - kind: website
    url: https://weekly.thingelstad.com/podcast/
    role: podcast
    feed: https://weekly.thingelstad.com/podcast.xml
  - kind: website
    url: https://www.thingelstad.com/2026/05/07/massive-weekly-thing-website-build.html
    role: reference
story:
  color: '#eaa18f'
  introduction: Curiosity, collected and shared.
  engineering:
    - WT Builder keeps an issue structured until it is sent, then renders different editions for the website, email, and audio.
    - The public archive is an Eleventy site. Thingy's private Librarian API builds the searchable archive that Thingy answers from.
    - Authoring, public publishing, and archive retrieval have explicit ownership boundaries.
  stack:
    - Eleventy
    - Publishing
    - Email
    - Audio
  source: https://weekly.thingelstad.com/
  sourceLabel: Read the archive
  related:
    - wt-builder
    - yearly-thing-2025
    - thingy
    - another-thing
  started: Published since 2017
  questions:
    - What is behind the publishing workflow?
    - How do Weekly Thing and Thingy connect?
---

The Weekly Thing is Jamie’s newsletter: the links he found interesting that week, each with his commentary, plus his own blog posts from the week. He sent the [first issue](https://weekly.thingelstad.com/archive/1/) on May 13, 2017, and has sent it most weekends since, taking breaks in summer and over the winter holidays. It began on TinyLetter, moved to MailChimp with [issue 23](https://weekly.thingelstad.com/archive/23/) in October 2017, and moved to Buttondown with [issue 131](https://weekly.thingelstad.com/archive/131/) in January 2020. He numbered those moves himself: “1.0: Launch on TinyLetter, 2.0: Move to MailChimp, 2.1: Custom HTML Template, 3.0: Buttondown.” He reached [issue 100](https://weekly.thingelstad.com/archive/100/) in April 2019, [200](https://weekly.thingelstad.com/archive/200/) in October 2021, and [300](https://weekly.thingelstad.com/archive/300/) in November 2024, which took “7 years 5 months 3 weeks and 6 days” ([Thoughts after writing 300 newsletters](https://www.thingelstad.com/2024/11/17/thoughts-after-writing.html)).

It grew out of the links. Of the Pinboard collection behind it he said, [“That database is the thing that actually became the genesis for the Weekly Thing. I was interested in a way to publish the bookmarks that I had found interesting that week, and that was really the backbone for the Weekly Thing.”](https://thingelstad.xyz/interviews/jamie-october-2026/#q11) He tells its history in eras:

> So I would say that the Weekly Thing has had four eras. The first being when it was originally launched on TinyLetter, the second being when it was running on MailChimp, the third being when it was running on Buttondown, and the fourth being still running on Buttondown, but now with WT Builder and me taking over the archive. And hosting that myself. This fourth one is really filled with a lot of stuff because it’s the WT Builder, it’s me taking over the archive, it’s creating a generated podcast that goes with it, there’s a huge expansion that happened in this fourth one. But the first three are really all about me learning the content cycle and figuring out the right platform for sending the email out.
>
> [Jamie, question 13](https://thingelstad.xyz/interviews/jamie-october-2026/#q13)

The platforms had reasons too. TinyLetter [“was aligned well to my indie web ethos”](https://thingelstad.xyz/interviews/jamie-october-2026/#q13). MailChimp [“really is a marketing tool, not a newsletter tool”](https://thingelstad.xyz/interviews/jamie-october-2026/#q13). Buttondown [“was designed for newsletters. It was designed to allow individuals to send. I loved that it used Markdown”](https://thingelstad.xyz/interviews/jamie-october-2026/#q13).

In May 2026, at 345 issues, he [rebuilt the website](https://www.thingelstad.com/2026/05/07/massive-weekly-thing-website-build.html) as a full archive with search, a table of contents for each issue, and Thingy for asking questions of the archive. The ten newest issues also got an audio edition, published as a [podcast](https://weekly.thingelstad.com/podcast/). He built it with Claude Code, Claude Design, and Codex, and called it a massive build. [Issue 349](https://weekly.thingelstad.com/archive/349/), two weeks later, was the first made in the Weekly Thing Workshop, a team of Discord agents. Starting with [issue 350](https://www.thingelstad.com/2026/09/20/i-just-published-weekly-thing.html) in September 2026, every issue has been written and sent from WT Builder. In October 2026 he [restructured the whole archive](https://www.thingelstad.com/2026/10/06/weekly-thing-archive-improved.html) so old issues render like new ones, and rendered every issue in audio, so the podcast feed “goes all the way back to the very first issue.”

Readers have had places to talk about issues. He [created r/WeeklyThing](https://www.thingelstad.com/2022/10/30/i-decided-to.html) in October 2022, and in September 2023 opened the [Weekly Thing Forum](https://www.thingelstad.com/2023/09/22/introducing-weekly-thing.html) on Ponder, which closed when Ponder shut down in November 2025 ([Farewell Ponder and Weekly Thing Forum](https://www.thingelstad.com/2025/11/17/farewell-weekly-thing-forum-and.html)). Discussion moved back to the subreddit ([Weekly Thing 334](https://weekly.thingelstad.com/archive/334/)). As of the interview, [“right now there are 1,600, over 1,600 people who subscribe to the Weekly Thing. Who read it, who engage with it on a regular basis.”](https://thingelstad.xyz/interviews/jamie-october-2026/#q30)

Since November 2024, readers can become [Supporting Members](https://www.thingelstad.com/2024/11/17/weekly-thing-supporting.html). All of that money goes to one digital non-profit each year: Creative Commons first, then the Electronic Frontier Foundation, which [received $1,164.92](https://weekly.thingelstad.com/archive/347/) in May 2026, and now [Signal](https://weekly.thingelstad.com/archive/350/). Asked what he hopes is still running in twenty years, after the blog: [“For sure, the Weekly Thing.”](https://thingelstad.xyz/interviews/jamie-october-2026/#q35)
