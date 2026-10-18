# Things I’ve built.

An index and archive of Jamie Thingelstad’s projects. The content tree under `content/` is the source of truth; Eleventy builds the static site from it, and GitHub Actions publishes the build to S3 behind CloudFront.

## Run locally

```sh
npm ci
npm run site:build   # content/ and data/observations/ -> _site/
npm run site:serve   # the same, with a local server on http://localhost:8080/
```

`npm run check` checks formatting, JavaScript/TypeScript and CSS lint, unused code, TypeScript, unit tests, and the site build. Use `npm run format` to apply formatting. `npx playwright install chromium`, then `npm run site:build` and `npm run test:browser`, runs browser tests of the static site at desktop, tablet, and phone sizes. They serve `_site/` through `scripts/serve-site.mjs`, which handles directory indexes and the 404 page the way CloudFront does.

## Static site

`site/eleventy.config.ts` and the templates in `site/` read the typed model in `collection/site.ts`, which joins the registry with the latest observation for every source. Pages: the index grouped by status, `/things/<id>/`, `/topics/<id>/`, `/history/`, and `/timeline/`. Outputs: `feed.xml` and `feed.json` (the ledger, newest first), `llms.txt` and `llms-full.txt`, a Markdown twin of every thing at `/things/<id>.md`, `things.json` for Librarian, `robots.txt`, and `sitemap.xml`. Status comes from the registry only; activity comes from observations only. `tests/site.test.ts` checks the model and the outputs.

Stylesheets, scripts, and fonts are written to `/assets/` with a content hash in the name and are served immutable; every other file is served with `no-cache`.

## Extend the collection

The content tree is the source of truth. See [docs/DIRECTION.md](docs/DIRECTION.md) for the model and [docs/HANDOFF.md](docs/HANDOFF.md) for the work list.

- `content/things/<id>.md`: one thing per file. Front matter holds title, summary, collection, status (`active`, `dormant`, `retired`, `archived`), URL, dates, topics, inline sources, and directed connections. The body is the story.
- `content/topics.yaml`: topic IDs, titles, and descriptions. Membership is declared on each thing.
- `content/history/<year>.yaml`: sourced history events. Dates keep their source precision (`YYYY`, `YYYY-MM`, or `YYYY-MM-DD`). Development records are not launch dates. A shared event appears once and names several things.
- `data/observations/`: generated evidence from `npm run collect` (GitHub activity, sitemap `lastmod` dates, feed items). Never edit by hand. Observations never change a status.
- `research/project-inventory.json`: the broader local research inventory, including unresolved archive candidates. It contains local paths and is **not public site data**.

```sh
npm run collect                 # observe every source; writes only changed evidence
npm run collect -- owner/repo   # one repository
```

The collector uses `GITHUB_TOKEN` when present (GitHub Actions) and the GitHub CLI's login otherwise. With a read-only `TINYLYTICS_API_KEY` (the repository secret of that name in Actions, or the environment locally) it also records monthly page views from Tinylytics for each site whose root is a website source; without the key it skips Tinylytics. It also asks the Internet Archive's Wayback CDX API, which needs no key, which days it captured each site (sources with the `website`, `archive` or `demo` role; a Wayback link stands for the page it captured), one request every six seconds, stopping for the run on a 429 or a refused connection. The weekly workflow in `.github/workflows/collect.yml` (Mondays 11:17 UTC) opens a pull request with changed observations, runs the checks on it, merges it when they pass, and dispatches the deploy. Only public HTTPS URLs and public repositories enter the content tree; the collector rejects private repositories before reading them and records repository creation, not project launch.

## Analytics

Tinylytics loads once from the page layout (`site/_includes/layout.njk`) using embed code `jyQF-tKd4sG-MEeyxvik`. Every page is a plain document load, so no route hooks are needed. Browser tests intercept the collector request rather than writing test visits to live analytics. Follow [Tinylytics embed guidance](https://tinylytics.app/docs/getting-started/embed) when changing the integration.

## Design

The site is a list, not an app. Fraunces headings and a paper palette, filled status chips with a dot, pill navigation, and a monogram sticker per thing (`sticker()` in `collection/site.ts`, seeded by the thing's ID) give it some play. Each thing row carries a sparkline of recent activity drawn from observations. The timeline page lays every thing on one axis with hoverable, keyboard-reachable event dots. A thing page draws its connections as a diagram above the list, rendered at build time by [Pele](https://pele.run) (`collection/diagram.ts`): static SVG with linked nodes in status colors, dashed for lineage, and no diagram code in the browser. Each diagram is rendered wide and narrow; phones get the narrow one only when it fits without shrinking the labels, and otherwise rely on the list, which carries the same edges with their sources. Motion respects reduced-motion preferences. Project imagery, when added, should favor screenshots of the actual products.

## Growing the shared history

The ledger is a curated snapshot assembled from public Git commit records, published episodes, and Jamie's blog/newsletter archive. It is not a live or exhaustive feed. For an agent-assisted update:

1. Read public repository history and published posts for a named project and date range. Never publish local paths or private material.
2. Propose meaningful events with source links: launches, releases, migrations, retirements, or notable changes. A repository's first commit may establish recorded development, but not the age of the idea.
3. Preserve date precision and credit collaborators. Deduplicate events by their source and meaning, including cross-project events.
4. Add accepted records to `content/history/<year>.yaml` and run `npm run check` and `npm run test:browser`. The history page, the timeline, the feeds, and the thing pages share the same ledger.

Scheduled ingestion writes observations only; it never adds ledger events (that is `docs/HANDOFF.md` step 8).

## GitHub and delivery

Source: [jthingelstad/thingelstad.xyz](https://github.com/jthingelstad/thingelstad.xyz). GitHub Actions runs Quality, Browser, and CodeQL checks on pull requests and pushes. A passing push to `main` publishes the exact checked commit to AWS using OIDC, with no stored AWS keys. Weekly Dependabot pull requests keep npm packages and pinned GitHub Actions current.

CI blocks high-severity runtime dependency vulnerabilities. The full development audit currently reports unpatched `braces` advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) through Stylelint's glob tooling; lint uses only the fixed repository CSS path, and this tooling is not part of the published site. Keep the full `npm audit` visible when reviewing dependency updates.

The local `research/` directory stays gitignored and is excluded from this public repository. No open-source license has been selected. See [DEPLOY.md](DEPLOY.md) for delivery, infrastructure updates, and rollback.

## What was retired

The first version of this site was a React application with an AI guide (a Lambda Web Function calling Amazon Bedrock, with a DynamoDB daily allowance) and a private collection editor served over Tailscale from Otto. All three were retired on October 17, 2026, once the content tree and the Eleventy build replaced them; the content lives in `content/`, and the collector replaced the editor's GitHub refresh. `DEPLOY.md` records the CloudFormation change sets that removed the guide.
