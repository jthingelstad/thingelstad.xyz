# Handoff: finishing the move to a content repository

This note is for a local Claude Code session on a machine with GitHub CLI access and the AWS profile. Read `docs/DIRECTION.md` first; it is the design. This file is the work list.

## What the cloud session did (branch `claude/charming-clarke-n68959`)

- **Content model** in `collection/schema.ts` and strict validation in `collection/validate.ts`. Loader in `collection/load.ts`.
- **Migrated** `src/data/collection.json` and `github.json` into `content/things/*.md` (55 things), `content/topics.yaml`, `content/history/<year>.yaml` (36 events), and `data/observations/github/*.json` (30). A round-trip check confirmed nothing was lost. `scripts/migrate-collection.ts` is kept for provenance and refuses to run again.
- **Legacy bridge** `collection/legacy.ts` and `npm run collection:build` regenerate the two JSON files the React site reads. `npm run build` runs it first. `tests/registry.test.ts` fails if the committed JSON drifts from the content tree. Content is the source of truth now; the JSON files are build outputs.
- **Collector** `npm run collect [-- owner/repo | https://site/]` with adapters for GitHub (`collection/adapters/github.ts`, a port of the editor’s importer) and websites (`collection/adapters/web.ts`: sitemap and RSS, Atom, JSON Feed). Writes only when evidence changed. Verified live against five websites here. GitHub could not be verified live from the cloud container (no valid API token), but the adapter has the same unit fixture as the original importer.
- **Weekly workflow** `.github/workflows/collect.yml` (Mondays 11:17 UTC, and manual). It commits changed observations directly to `main`. If `main` has branch protection that blocks the Actions bot, change it to open a pull request instead.
- **Feeds and sitemaps** attached to the blog, Weekly Thing, Another Thing, R/W Book Club, and Your Version Number sources.
- **Four new things from Thingy’s list**, all needing Jamie’s review: `things-ive-built`, `yearly-thing-2025` (status archived), `flight-path` (status active; the site returned an error from the cloud proxy, check it), `proof-of-a-person` (no URL or repository yet). Three new 2026 ledger events with sources.
- **Status mapping**: every `historical: true` thing became `retired`. Several are better described as `archived` (Yearly Thing style one-time projects, events, the candle fundraisers) or `dormant` (WikiApiary, which others still run). Refine by hand.
- Removed `scripts/refresh-github.ts`; the editor’s own refresh route still exists but writes a file that the build now regenerates, so do not use it.

## Done locally on 2026-10-17

1. **Content review.** Statuses refined (one-time projects and events are `archived`, WikiApiary is `dormant`), sourced `started` and `ended` dates added, placeholder summaries replaced where a source supported it, four ledger events added. Flight Path's host `flightpath.poaprally.com` no longer resolves and has no Wayback capture, so it is `retired` and points at the Weekly Thing 342 essay. Proof of a Person now has `jthingelstad/poap-archive` as a source. Judgment calls for Jamie: Road Sign Math is `archived` (a rebuild is in progress locally, so `dormant` is defensible); Smaller Than a Redwood, Thinglesbot, Velotweets, Wikinosh, and WikiWonders stay `retired` with placeholder summaries; several active things still carry one-word summaries from the migration ("Podcast", "Existing code project").
2. **Collector run.** `npm run collect` ran live against GitHub with the CLI login: 21 observations written, 16 unchanged, none failed. One design note: the 90-day window slides with the run date, so the edge month's commit count changes every week even with no new commits (`mb` went from 6 to 1 for July). Anchoring the window to month boundaries in `collection/adapters/github.ts` would keep weekly runs quiet, as DIRECTION's "weekly noise" risk asks.
3. **Eleventy build.** `npm run site:build` writes `_site/` from `site/` and `collection/site.ts`; `npm run check` builds both sites. All pages and outputs exist. The timeline's row labels scroll away on narrow screens; a sticky label column is a possible refinement.
4. **Browser tests.** `tests/browser/site.spec.ts` replaces the gallery spec: index counts by status, a thing page, two-way connections, topic pages, history anchors, timeline tooltips, the feeds and machine outputs, a 404, no horizontal overflow, Tinylytics intercepted. They run against `_site/` through `scripts/serve-site.mjs`, which serves directory indexes and `404.html` the way CloudFront now does.
5. **Deploy path.** `scripts/deploy.mjs` publishes `_site/`: `/assets/` (content-hashed css, js, fonts) immutable, everything else `no-cache` with explicit content types, pages after files and the front page last, nothing deleted, then a `/*` invalidation and a byte check of the front page and one thing page. The CloudFront change (a viewer-request function that serves `index.html` for directory URLs and redirects `/things/x` to `/things/x/`, plus 403 and 404 mapped to `/404.html`) was deployed from this branch as the reviewed change set `cloud-engineer-directory-index-20261017` on 2026-10-17, before the first publish. The guide's `/api/health` check stays in the deploy until step 6 removes the guide.

## Order of work

1. **Review the content tree.** Open `content/things/`. Fix statuses, add `started` and `ended` dates where a source supports them, and check the four new things. Run `npm run collection:build && npm run check`.
2. **Run the collector locally** with `gh` logged in: `npm run collect`. Expect it to write updated GitHub observations for most repositories. Commit `data/observations` and the regenerated JSON together.
3. **Eleventy build.** Create the static generator reading `content/` and `data/observations/` through `collection/load.ts` and `collection/observations.ts` (they are plain Node modules). Pages: index, `/things/<id>/`, `/things/<id>.md`, `/topics/<id>/`, `/history/`, a timeline. Outputs: `feed.xml`, `feed.json`, `llms.txt`, `llms-full.txt`, `things.json`. Keep Tinylytics as it is in `index.html` today, with the same embed code and intercepts in browser tests.
4. **Browser tests** for the new pages at desktop, tablet, and phone sizes, replacing `tests/browser/gallery.spec.ts`.
5. **Deploy path.** Point `scripts/deploy.mjs` and the CI deploy job at the Eleventy output. Keep hashed asset preservation and rollback behavior from `DEPLOY.md`.
6. **Retire** the guide, editor, Lambda, DynamoDB, and their CloudFormation resources through the reviewed change set process in `DEPLOY.md`. Remove `server/`, `editor/`, `infra/templates.mjs` sections for the guide, the Playwright editor config, and the React `src/`. Shrink the deploy role to S3 and CloudFront. Update `AGENTS.md`, `README.md`, `DEPLOY.md`, and `DNS.md`.
7. **Librarian.** Publish `things.json` and point Librarian’s ingestion at it. Add the connection in `content/things/librarian.md` once it is real.
8. **Collector proposals.** Teach the collector to write candidate ledger events (new release, repository archived, first commit for a new source) to a pull request rather than to `content/`.

## Conventions to keep

- Date precision stays as the source states it. Development records are not launch dates.
- Only public HTTPS URLs and public repositories enter the content tree. Nothing from `research/` or local paths.
- Observations are never edited by hand and never set a status.
- `npm run format` before committing. Prettier formats the Markdown front matter and YAML.
