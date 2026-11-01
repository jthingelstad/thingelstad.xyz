---
title: Your Version Number
summary: 'A website that writes your age as a software version, decades.years.days, with a Work Edition for job tenure.'
collection: Personal tools and making
status: active
url: https://yourversionnumber.com/
started: '2026-05-03'
topics:
  - play
sources:
  - kind: github
    repository: jthingelstad/yourversionnumber.com
    role: implementation
  - kind: website
    url: https://yourversionnumber.com/
    role: website
    sitemap: https://yourversionnumber.com/sitemap.xml
  - kind: website
    url: https://www.thingelstad.com/2018/02/24/your-version-number.html
    role: reference
  - kind: website
    url: https://www.thingelstad.com/2026/05/06/your-version-number-the-website.html
    role: reference
connections:
  - kind: lineage
    to: release-notes
    label: grew into
    detail: Release Notes uses Your Version Number’s birthday arithmetic in a daily email and personal journal.
    source: https://github.com/jthingelstad/yvn-release-notes
story:
  color: '#1763ff'
  introduction: A different way to count the days.
  engineering:
    - A framework-free static site calculates its numbers in the browser.
    - Dates, people, themes, and signed cards travel in the URL, making a view shareable without an account.
    - The related Release Notes product adds daily email and a personal journal. It has its own server and storage.
  stack:
    - JavaScript
    - CSS
    - Static web
    - URL state
  source: https://github.com/jthingelstad/yourversionnumber.com
  related:
    - release-notes
    - mb
  started: The idea began in 2018
  questions:
    - How does the version number work?
    - How is Release Notes related?
---

In February 2018 Jamie wrote [Your Version Number](https://www.thingelstad.com/2018/02/24/your-version-number.html), building on a habit of his friend David Hussman, who gave his age as a version number. He mapped it to semantic versioning: decades are the major version, years into the decade the minor, and days since the last birthday the patch. He was v4.6.52 that day, and he made a Workflow script to show the versions of people in his address book. David died that August. The [site’s About page](https://yourversionnumber.com/about/) says the arithmetic is his, because it is. The breakfast where it started:

> the idea came from a conversation I was having with my friend. David Hussman, and he was, he and I were talking about this idea of software versions and talking about like, you know, having a major version, a minor version, and every day. And we were just riffing on this idea and really both like just jamming on like it being a really fun concept.
>
> [Jamie, question 12](https://thingelstad.xyz/interviews/jamie-october-2026/#q12)

[“we were at Sun Street Breads. Having a conversation over breakfast.”](https://thingelstad.xyz/interviews/jamie-october-2026/#q12) Of David: [“I really miss him. He, he’s a he was a good friend and and and gone too early.”](https://thingelstad.xyz/interviews/jamie-october-2026/#q12)

After a year of seeing his version through a [shortcut on his phone](https://www.thingelstad.com/2025/02/25/jamie.html), he made it a website with Claude Code in May 2026, first shared in [Weekly Thing 346](https://weekly.thingelstad.com/archive/346/) on May 3, 2026 and then in [a launch post](https://www.thingelstad.com/2026/05/06/your-version-number-the-website.html). Add one or more birthdays, pick one of the themes, and the page shows each version, counting up at midnight. Everything lives in the URL, so a view can be bookmarked, set as a home page, or sent to someone, with no account. Cards with a signed note work the same way. It is, he said, an idea [“that started as a seed and has refused to go away”](https://thingelstad.xyz/interviews/jamie-october-2026/#q5), and [“Your Version Number is a really great way to bring that into daily life in a way that is just fun and interesting”](https://thingelstad.xyz/interviews/jamie-october-2026/#q12).

The Work Edition applies the same idea to a job: completed years of tenure, the quarter of the current tenure year, and weekdays into that quarter, with a build number that counts every business day, and work themes such as a board update. In October 2026 the idea grew into [Release Notes](https://notes.yourversionnumber.com/), a daily email of the day’s version with a journal attached.
