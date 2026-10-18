---
title: Shortcuts
summary: Apple Shortcuts Jamie builds and shares, from the workflow that assembles the Weekly Thing to Micro.blog collection tools.
collection: Personal tools and making
status: active
url: https://www.thingelstad.com/collections/shortcuts/
started: '2016-11'
topics:
  - automation
sources:
  - kind: website
    url: https://www.thingelstad.com/collections/shortcuts/
    role: reference
  - kind: website
    url: https://www.thingelstad.com/2025/01/11/microblog-collections-shortcuts.html
    role: reference
connections:
  - to: weekly-thing
    label: assembles
    detail: A Build Issue shortcut runs a list of section shortcuts and combines the Markdown each returns into an issue, an approach Jamie has used since 2017.
    source: https://www.thingelstad.com/2023/09/24/how-i-build.html
  - to: jamie-thingelstad-blog
    label: builds photo collections for
    detail: The Micro.blog Collection Creator, Copier and Viewer shortcuts use the Micro.blog API to populate the photo collections on Jamie’s blog.
    source: https://www.thingelstad.com/2025/01/11/microblog-collections-shortcuts.html
  - to: your-version-number
    label: calculates
    detail: A shortcut Jamie wrote calculates his version number, and a daily automation shows it as a widget on his phone.
    source: https://www.thingelstad.com/2025/02/25/jamie.html
  - kind: lineage
    to: weekly-thing-workshop
    label: was succeeded by
    detail: In May 2026 Jamie replaced his Shortcuts workflow for assembling the Weekly Thing, which “only runs when I engage with it,” with a team of Discord agents.
    source: https://www.thingelstad.com/2026/05/12/the-weekly-thing-team.html
---

Jamie uses Apple Shortcuts “everyday on nearly every device” to automate small tasks, write one-off scripts and build complex workflows, and he collects the posts about them on a [Shortcuts collection](https://www.thingelstad.com/collections/shortcuts/) page. Several are shared for others to install: [My QR Codes](https://www.thingelstad.com/2023/05/21/my-qr-codes.html) (2023) puts a phone’s most-shared links on screen as QR codes, and [Launch Apps](https://www.thingelstad.com/2023/09/30/launch-apps-shortcut.html) (2023) opens a Mac’s usual set of apps from the menu bar.

He was building in Workflow, the iOS app that became Shortcuts, by November 2016, when he [made a fancier word count and reading time workflow](https://www.thingelstad.com/2016/11/28/created-a-fancier.html). From 2016 he also kept a public set of TaskPaper [project templates](https://github.com/jthingelstad/Taskpaper-Templates), for jobs like setting the clocks for Daylight Saving Time in walking order, that his workflows turned into OmniFocus projects ([Using Project Templates](https://www.thingelstad.com/2017/05/19/using-project-templates.html)).

The largest is the Weekly Thing’s production workflow. In 2017 Jamie [assembled the newsletter](https://www.thingelstad.com/2017/06/23/assembling-the-weekly.html) with Workflow: a master workflow set the cutoff date, called one workflow per section, and stitched the HTML blocks they returned into an issue. In 2023 he [rebuilt it](https://www.thingelstad.com/2023/09/24/how-i-build.html) as native Shortcuts that return Markdown, with no Python steps, Data Jar to cache each section, and the S3 Files app to automate the photo section for the first time. In 2025 he added [LLM calls](https://www.thingelstad.com/2025/03/09/how-i-use-ai-in.html) for jobs like suggesting subject lines and fortunes. In May 2026 the [Weekly Thing Workshop](https://www.thingelstad.com/2026/05/12/the-weekly-thing-team.html), a team of Discord agents, took over assembling the issue.

For his Micro.blog photo collections Jamie wrote three shortcuts in December 2024 and January 2025: [Collection Creator](https://www.thingelstad.com/2024/12/30/microblog-collection-creator-shortcut.html), which builds a collection from a clipboard of image links, Collection Copier, and Collection Viewer. He [shared all three](https://www.thingelstad.com/2025/01/11/microblog-collections-shortcuts.html); they need a Micro.blog app token and the free Logger for Shortcuts app. In December 2025 he shared [Add to List](https://www.thingelstad.com/2025/12/07/add-to-list-shortcut.html), which captures ideas into OmniFocus lists.
