---
title: Another Thing Builder
summary: An authoring app Jamie built in 2026 for the Another Thing podcast, retired before it sent a single episode.
collection: Publishing
status: retired
url: https://github.com/jthingelstad/at-builder
started: '2026-08-28'
ended: '2026-10-11'
topics:
  - open-web
sources:
  - kind: github
    repository: jthingelstad/at-builder
    role: implementation
connections:
  - kind: lineage
    to: wt-builder
    label: was succeeded by
    detail: The earlier podcast authoring application was retired when WT Builder took on Another Thing in October 2026.
    source: https://github.com/jthingelstad/wt-builder/commit/bea76c7ef4fc79a878072feebf694ce18ad217ea
  - to: another-thing
    label: was built to make
    detail: AT Builder was the authoring application for the Another Thing podcast, meant to publish each episode with one commit to another.thingelstad.com.
    source: https://github.com/jthingelstad/at-builder
---

AT Builder was meant to do for [Another Thing](https://another.thingelstad.com/), Jamie’s podcast, what WT Builder does for the Weekly Thing. Its [README](https://github.com/jthingelstad/at-builder) describes the plan: help outline an episode, show cards on a teleprompter during recording, master the audio, transcribe it, and publish the finished episode with one commit to the podcast’s website. Jamie kept it separate from WT Builder on purpose, so that each app owned exactly one product.

Most of it got built, but no episode ever went through it. On October 11, 2026, Jamie retired it and [moved podcast authoring into WT Builder](https://github.com/jthingelstad/wt-builder/commit/bea76c7ef4fc79a878072feebf694ce18ad217ea) as a second product. The outline, recording card, mastering, transcript, and send went with it. The repository is archived as “the record of what was tried.”
