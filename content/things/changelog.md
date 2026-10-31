---
title: Changelog
summary: An iPhone app for getting notes into Release Notes in two taps, with photos, voice memos, places, my Upcoming dates, Siri, and widgets.
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
    caption: Release Notes’ own icon, the V and dot over two lines of notes, from the first scaffold. It has not changed since.
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
---

Changelog is an iPhone app for getting notes into [Release Notes](https://notes.yourversionnumber.com/), my daily Your Version Number email. It is not a second Release Notes: reading, searching, and looking back stay on the web, and Changelog is for getting things in. I write a line, tap a tag, and Commit, and it is in today’s notes. A note can carry photos, a voice memo, or where I am, and Siri, the Action Button, a widget, or the share sheet can start one. My Upcoming dates, and the activity log from every channel, are a tab away.

I built it with coding agents in a single day, starting on the morning of October 29, 2026. It began as two documents, a plan for the API Release Notes would need and a scope for the app, and both are below. The repository was made at 7:43 a.m., and by 8:06 the first scaffold had Log, Activity, Settings, and a sign-in that took a pasted token. Its first README listed photos and voice memos, Upcoming, and Shortcuts and widgets as versions to come. All three arrived that same day, along with signing in with Release Notes, and the first build was on TestFlight by that evening.

For its first day it wore iOS’s own look: grouped lists on grey, the system font, and blue links. On October 30 I asked for it to match the Release Notes website, and every screen, sheet, and widget moved onto the site’s paper: cream and navy, cobalt for actions, a tangerine Commit, and the site’s two typefaces, Bricolage Grotesque and Martian Mono. The screens below show each one before and after, taken on the simulator against the Release Notes dev server and its fictional account.

It numbers itself the way Release Notes numbers people, which I find delightful. Changelog was 0.0.0 on the day it started and 0.0.1 the next, and the foot of Settings names each build’s version and commit. What each version brought is written up as [Release Notes for Changelog](https://notes.yourversionnumber.com/guide/changelog/) on the Release Notes site, which also has the TestFlight invitation. Its code is open on GitHub under the MIT License.
