---
title: Changelog
summary: 'An iPhone app for getting notes into Release Notes in two taps, with photos, voice memos, places, Upcoming dates, Siri, and widgets. Jamie’s first iPhone app.'
collection: Personal tools and making
status: active
url: https://github.com/jthingelstad/changelog-ios
started: '2026-10-29'
topics:
  - play
sources:
  - kind: github
    repository: jthingelstad/changelog-ios
    role: implementation
  - kind: website
    url: https://notes.yourversionnumber.com/guide/changelog/
    role: reference
connections:
  - to: release-notes
    label: sends notes into
    detail: Changelog talks only to Release Notes’ public API, as any app someone writes for it can. It signs in with Release Notes, which asks what it may do and gives it a token of its own.
    source: https://notes.yourversionnumber.com/guide/changelog/
story:
  color: '#1a4fe0'
  introduction: What changed today? Commit.
  engineering:
    - The app talks only to Release Notes’ public /v1 API. Signing in is OAuth with PKCE, and the code that comes back is spent once for an ordinary API token, with no refresh token.
    - Every write goes through an offline queue with an idempotency key, so a note written without a connection waits on the phone, and a resend never makes a duplicate.
    - ChangelogKit, a Swift package with the API client, the queue, a port of Release Notes’ hashtag rules, and the Keychain storage, is tested on its own. The app, the share extension, and the widgets are SwiftUI on top of it, with no third-party packages.
    - A test cycle drives the app on a simulator against the Release Notes dev server and its fictional account, and checks each note, photo, voice memo, and date against what the server kept.
  stack:
    - Swift and SwiftUI
    - iOS 26
    - App Intents
    - WidgetKit
    - Release Notes API
    - TestFlight
  questions:
    - What does Changelog do that the Release Notes email and website do not?
    - How does Changelog keep a note written offline from being lost or sent twice?
    - What did Changelog look like before its redesign?
bundles:
  - id: the-plan
    title: The plan
    caption: Before any code, two documents written for my review on the morning of October 29, and kept up to date through the day as I answered their questions. One is the API Release Notes would need, the other the app that would use it, and each was checked against the other. They are here as they were, lightly redacted.
  - id: first-scaffold
    title: The first scaffold
    caption: From the repository’s first half hour.
  - id: before
    title: 'Before: the first day, in iOS’s own look'
    caption: October 29, on the simulator against the Release Notes dev server’s fictional account. Grouped lists on grey, the system font, and blue links.
  - id: after
    title: 'After: on the paper'
    caption: The same screens on October 30, after the redesign that put every screen on the Release Notes website’s paper, with the same fictional account and the same dates. Cream and navy, cobalt for actions, a tangerine Commit, and the site’s two typefaces, Bricolage Grotesque and Martian Mono.
  - id: 'icon-studies'
    title: 'Finding a separate icon'
    caption: 'Icon studies made with Codex on October 31, 2026. The single folded v went to Release Notes. Changelog’s selected direction repeats the fold as three stacked versions; a list of paper slips was set aside.'
  - id: 'member-icons'
    title: 'Four member editions'
    caption: 'Paper, Copper, Terminal and Afterglow keep the same three-layer mark. These are proposed alternative app icons for Supporting Members of the Weekly Thing.'
  - id: 'icon-design-files'
    title: 'The design record'
    caption: 'The sequence, prompts and small-size previews from the design exercise. These files record choices and studies, not a release of the app.'
artifacts:
  - file: api-plan-2026-10-29.md
    bundle: the-plan
    title: The API plan
    caption: 'Tokens, a public API and Changelog as one idea with two doors: what the API would do, the order to build it in, and my calls on each question, quoted as I gave them. Every phase of it was built that day. Taken out: a cousin’s name, an email address, and one sentence.'
    date: '2026-10-29'
  - file: app-scope-2026-10-29.md
    bundle: the-plan
    title: The app’s scope
    caption: 'Changelog’s screens sketched in text, notifications with no push server, and a table checking each thing the app would do against the API plan, which changed the plan before any of it was built. Taken out: a cousin’s name and an email address.'
    date: '2026-10-29'
  - file: app-icon.png
    bundle: first-scaffold
    title: The icon
    caption: The shared V and dot over two lines of notes, from the first scaffold, before the separate icon studies below.
    date: '2026-10-29'
    source: https://github.com/jthingelstad/changelog-ios/commit/db1850e180878ab1c61e933aad28a4603116d59c
  - file: first-readme.md
    bundle: first-scaffold
    title: The first README
    caption: From the first scaffold, before the API it talks to was live. Photos and voice memos, Upcoming, and Shortcuts and widgets are listed for later versions; all three arrived that same day.
    date: '2026-10-29'
    source: https://github.com/jthingelstad/changelog-ios/blob/db1850e180878ab1c61e933aad28a4603116d59c/README.md
  - file: sign-in-2026-10-29.png
    bundle: before
    title: The first screen
    caption: The first scaffold’s sign-in, that morning, which took a token pasted from Release Notes’ Settings. Signing in with Release Notes itself came that evening.
    date: '2026-10-29'
  - file: log-2026-10-29.png
    bundle: before
    title: Log, in iOS’s own look
    caption: Today’s version, a box for what changed, one-tap tags, buttons for a photo, the camera, a voice memo and the place, and Commit, with today’s activity underneath.
    date: '2026-10-29'
  - file: upcoming-2026-10-29.png
    bundle: before
    title: Upcoming
    caption: Birthdays, an anniversary, a trip and an event, each in the line the morning email gives it, like “Mom turns 6.8.0.”
    date: '2026-10-29'
  - file: add-a-date-2026-10-29.png
    bundle: before
    title: Adding a date
    caption: A birthday, anniversary, trip or event, whether it goes in the morning email, and when the phone reminds me.
    date: '2026-10-29'
  - file: activity-2026-10-29.png
    bundle: before
    title: Activity
    caption: What came in, changed and went out, from every channel, without a note’s words.
    date: '2026-10-29'
  - file: settings-2026-10-29.png
    bundle: before
    title: The foot of Settings
    caption: 'Pinned tags, links to Release Notes, a debug build’s server switch, and the build line: Changelog 0.0.0, build 8a54afc, made Oct 29 at 3:57 PM CDT.'
    date: '2026-10-29'
  - file: sign-in-2026-10-30.png
    bundle: after
    title: Signing in
    caption: By now Changelog signs in with Release Notes itself, which asks me to name the token it keeps and choose what it may do. A pasted token still works.
    date: '2026-10-30'
  - file: log-2026-10-30.png
    bundle: after
    title: Log on the paper
    caption: The day in mono capitals, today’s version large and tomorrow’s under it, and below, a note filed and read back with its words.
    date: '2026-10-30'
  - file: upcoming-2026-10-30.png
    bundle: after
    title: Upcoming on the paper
    caption: The same five dates, each day in cobalt mono over its line.
    date: '2026-10-30'
  - file: add-a-date-2026-10-30.png
    bundle: after
    title: Adding a date on the paper
    caption: The same form, flat on the paper instead of in grouped boxes.
    date: '2026-10-30'
  - file: activity-2026-10-30.png
    bundle: after
    title: Activity on the paper
    caption: With a line marking where I last looked, so what is new since is on top.
    date: '2026-10-30'
  - file: settings-2026-10-30.png
    bundle: after
    title: The foot of Settings on the paper
    caption: 'The build line in Martian Mono: Changelog 0.0.1, build 974deb4.'
    date: '2026-10-30'
  - file: log-paper-2026-10-30.png
    bundle: after
    title: Log, as the guide shows it
    caption: The screenshot on Release Notes for Changelog, the app’s page on the Release Notes site.
    date: '2026-10-30'
    source: https://notes.yourversionnumber.com/guide/changelog/
  - file: upcoming-paper-2026-10-30.png
    bundle: after
    title: Upcoming in dark
    caption: The same paper in the website’s dark navy, from the guide.
    date: '2026-10-30'
    source: https://notes.yourversionnumber.com/guide/changelog/
  - file: 'icon-entries-2026-10-31.png'
    bundle: 'icon-studies'
    title: 'Entries, set aside'
    caption: 'Three curled paper slips on tangerine, each with a cobalt dot. This was the list-based alternative to repeating the version mark.'
    date: '2026-10-31'
  - file: 'icon-versions-first-2026-10-31.png'
    bundle: 'icon-studies'
    title: 'Versions, the first stack'
    caption: 'Three folded v marks in cobalt, tangerine and ivory on ink navy. This became the direction for Changelog.'
    date: '2026-10-31'
  - file: 'icon-versions-2026-10-31.png'
    bundle: 'icon-studies'
    title: 'Versions, refined'
    caption: 'The stack with more clear space around its edges and simpler fold shading. It was checked at 60 pixels beside Release Notes’ single v and dot.'
    date: '2026-10-31'
  - file: 'icon-versions-paper-2026-10-31.png'
    bundle: 'member-icons'
    title: 'Paper'
    caption: 'Cobalt, tangerine and ink navy paper on cream.'
    date: '2026-10-31'
  - file: 'icon-versions-copper-2026-10-31.png'
    bundle: 'member-icons'
    title: 'Copper'
    caption: 'Three copper tones on warm charcoal, with brushed metal in place of paper.'
    date: '2026-10-31'
  - file: 'icon-versions-terminal-2026-10-31.png'
    bundle: 'member-icons'
    title: 'Terminal'
    caption: 'Three phosphor-green tones on near-black green.'
    date: '2026-10-31'
  - file: 'icon-versions-afterglow-2026-10-31.png'
    bundle: 'member-icons'
    title: 'Afterglow'
    caption: 'Violet, coral and peach paper on dark plum.'
    date: '2026-10-31'
  - file: 'icon-design-process-2026-11-01.txt'
    bundle: 'icon-design-files'
    title: 'How the two marks separated'
    caption: 'A record of the single v moving to Release Notes, the two Changelog directions, the selected stack, member editions and favicon studies.'
    date: '2026-11-01'
  - file: 'icon-design-files-2026-11-01.zip'
    bundle: 'icon-design-files'
    title: 'The icon design files'
    caption: 'Full-size PNG studies, small-size previews, the design record and generation prompts.'
    date: '2026-11-01'
    preview: 'icon-design-files-preview-2026-11-01.png'
---

Changelog is an iPhone app for getting notes into [Release Notes](https://notes.yourversionnumber.com/), the daily Your Version Number email. It is not a second Release Notes: reading, searching, and looking back stay on the web, and Changelog is for getting things in. You write a line, tap a tag, and Commit, and it is in today’s notes. A note can carry photos, a voice memo, or where you are, and Siri, the Action Button, a widget, or the share sheet can start one. Your Upcoming dates, and the activity log from every channel, are a tab away.

Jamie built it with coding agents in a single day, starting on the morning of October 29, 2026. It began as two documents, a plan for the API Release Notes would need and a scope for the app, and both are below. The repository was made at 7:43 a.m., and by 8:06 the first scaffold had Log, Activity, Settings, and a sign-in that took a pasted token. Its first README listed photos and voice memos, Upcoming, and Shortcuts and widgets as versions to come. All three arrived that same day, along with signing in with Release Notes, and the first build was on TestFlight by that evening. It is, in his words, [“my very first attempt at an iPhone app”](https://thingelstad.xyz/interviews/jamie-october-2026/#q19).

For its first day it wore iOS’s own look: grouped lists on grey, the system font, and blue links. On October 30 he asked for it to match the Release Notes website, and every screen, sheet, and widget moved onto the site’s paper: cream and navy, cobalt for actions, a tangerine Commit, and the site’s two typefaces, Bricolage Grotesque and Martian Mono. The screens below show each one before and after, taken on the simulator against the Release Notes dev server and its fictional account.

On October 31, 2026, Jamie explored [separate icons](#artifacts-icon-studies) for Changelog and Release Notes with Codex. The [single folded v and its dot](/things/release-notes/#artifacts-icon-studies) went to Release Notes. For Changelog he chose three folded v marks stacked diagonally, called Versions. Paper, Copper, Terminal and Afterglow followed as [member-edition studies](#artifacts-member-icons). The [design record](#artifacts-icon-design-files) keeps the discarded direction, the refinements and the generation prompts.

It numbers itself the way Release Notes numbers people. Changelog was 0.0.0 on the day it started and 0.0.1 the next, and the foot of Settings names each build’s version and commit. What each version brought is written up as [Release Notes for Changelog](https://notes.yourversionnumber.com/guide/changelog/) on the Release Notes site, which also has the TestFlight invitation. Its code is open on GitHub under the MIT License. His cousin Quinn, he said, is [“working alongside me to build an Android version of Changelog that works with it”](https://thingelstad.xyz/interviews/jamie-october-2026/#q19).
