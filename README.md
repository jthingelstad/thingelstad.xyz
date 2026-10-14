# Things I’ve built.

A React application for Jamie Thingelstad’s project collection: a white project map, browsable connections, project stories, and a grounded AI guide.

## Run locally

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The preview binds only to loopback. `npm run check` checks formatting, JavaScript/TypeScript and CSS lint, unused code, TypeScript, unit tests, and the production build. Use `npm run format` to apply formatting. `npx playwright install chromium` followed by `npm run test:browser` runs browser tests at desktop, tablet, and phone sizes. For the production build locally, run `npm run build` then `npm start`.

## Extend the collection

- `src/data/collection.json`: the versioned public collection. Things, optional stories, sources, many-to-many source attachments, connections, topics, and sourced history live in one document.
- `src/data/github.json`: saved public GitHub observations, refreshed explicitly. Imported evidence never overwrites editorial content.
- `src/data/projects.ts`, `connections.ts`, `topics.ts`, and `history.ts`: typed views and deterministic graph/timeline layouts derived from the collection.
- Connections are directed, with a label, explanation, and reference. `kind: "lineage"` describes evolution or succession. Topics describe overlapping interests, independently of connections.
- History dates retain their source precision (`YYYY`, `YYYY-MM`, or `YYYY-MM-DD`). Development records are not launch dates. A shared event appears once and can reference several things. Undated things remain available without invented dates.
- `research/project-inventory.json`: the broader local research inventory, including unresolved archive candidates. It contains local paths and is **not public site data**.

The public catalog contains 51 records, including NNXYZ and the retired Reading Things newsletter. The research inventory contains 63 entries, including candidates, references, and the new gallery itself. Worktrees were deduplicated. Protected directories and mounted archives prevented a literally exhaustive machine-wide audit; see the inventory’s scope notes.

## AI guide

The server uses Amazon Bedrock ConverseStream with `us.anthropic.claude-haiku-4-5-20251001-v1:0` in `us-east-1`. `BEDROCK_MODEL_ID` can override the model. Credentials resolve through the existing local `cloud-engineer` profile; the server verifies account and role before invocation. No keys or credentials enter the browser.

The guide receives only public catalog records, curated stories, documented relationships, shared topics, sourced history, the visitor’s question, and four recent exchanges held in browser memory. It returns a validated explanation and existing project IDs. It cannot execute project tools or access local project files. Questions and answers are sent to Bedrock. This AWS account has private Bedrock invocation logging enabled, with an S3 lifecycle policy expiring those logs after 30 days. The application does not keep a conversation database or log prompts itself. Requests have size, concurrency, origin, and time bounds.

Production uses a private S3 bucket behind CloudFront, a Lambda Web Function, and a workload role restricted to the guide’s model and anonymous daily request counter. The guide allows 100 valid attempts per UTC day across the site, with up to two serving environments, one concurrent request per environment, and a 24-second model deadline. The guide streams its status and validated result over HTTP. There is no application request-per-second throttle; platform quotas still apply. Lambda can briefly exceed its environment limit during rollout or fleet maintenance. The graph remains available when the guide is unavailable. The daily counter stores no visitor identity or conversation and expires after two days. Historical links are archive references, not claims that an old service still operates. The birthday and command previews are local illustrations; they do not call the original products.

## Analytics

Tinylytics loads once from `index.html` using embed code `jyQF-tKd4sG-MEeyxvik` with `?spa` and `defer`. The React route effect calls `window.tinylytics?.triggerUpdate?.()` after graph selection, view changes, project navigation, and browser Back. Tinylytics suppresses repeated calls for the same URL. Filtering the index does not create a view. Analytics availability does not gate rendering or navigation.

Integration checks intercept collector requests rather than writing test visits to live analytics. Follow [Tinylytics embed guidance](https://tinylytics.app/docs/getting-started/embed) when changing the integration.

## Design

Browsing is the primary mode. The homepage is a timeline graph, with a Connections layout as an alternative. Topics illuminate overlapping interests without removing projects. Year navigation, draggable and scrollable navigation, and a project inspector support browsing. On phones, the timeline uses one column and touch scrolling; the wider Connections layout retains pan and zoom. The History view has an interactive monthly heatmap and a sourced event list. Counts represent indexed events, not every commit; empty months are gaps in the index, not proof of inactivity. Year-only events stay outside monthly counts. Selecting a connected project reveals its actual relationships; selecting an unconnected project reveals its story and other places to continue. Selection, graph layout, topic, history year, and history month are reflected in the URL so a particular thing can be shared and browser Back retraces a browsing path. The AI guide is a collapsed, contextual companion to the selected project. It is not the homepage entry point. The index retains a small filter for finding a known project. Generated illustrations and decorative object art were removed following Jamie’s feedback. Future project imagery should favor screenshots of the actual products. The earlier image concepts remain research history, not the current visual specification. Motion respects reduced-motion preferences; graph nodes and project reveals have keyboard equivalents. Graph zoom scrolls inside its canvas on small screens, with a selector for direct access to every node.

## Growing the shared history

The initial ledger is a curated snapshot assembled from public Git commit records, published episodes, and Jamie's blog/newsletter archive. It is not a live or exhaustive feed. For an agent-assisted update:

1. Read public repository history and published posts for a named project and date range. Never publish local paths or private material.
2. Propose meaningful events with source links: launches, releases, migrations, retirements, or notable changes. A repository's first commit may establish recorded development, but not the age of the idea.
3. Preserve date precision and credit collaborators. Deduplicate events by their source and meaning, including cross-project events.
4. Add accepted records to the collection’s `history` list and run `npm run check` and `npm run test:browser`. The timeline, inspector, activity view, and AI guide share the same ledger.

GitHub refresh is explicit. Scheduled ingestion has not been enabled.

## GitHub and delivery

Source: [jthingelstad/thingelstad.xyz](https://github.com/jthingelstad/thingelstad.xyz). GitHub Actions runs Quality, Browser, and CodeQL checks on pull requests and pushes. A passing push to `main` publishes the exact checked commit to AWS using OIDC, with no stored AWS keys. Weekly Dependabot pull requests keep npm packages and pinned GitHub Actions current.

CI blocks high-severity runtime dependency vulnerabilities. The full development audit currently reports unpatched `braces` advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) through Stylelint's glob tooling; lint uses only the fixed repository CSS path, and this tooling is excluded from production artifacts. Keep the full `npm audit` visible when reviewing dependency updates.

The local `research/` directory stays gitignored and is excluded from this public repository. No open-source license has been selected. See [DEPLOY.md](DEPLOY.md) for delivery, infrastructure updates, and rollback.

## Collection editor and sources

The editor uses versioned JSON files, not MySQL or SQLite. It is a separate local service with a separate client build under `.build/editor/`. Only `dist/` is published. Neither the editor client nor its file-write API is included in the public site or Lambda artifact.

```sh
npm run editor:build
npm run editor
```

Open http://127.0.0.1:5174/. On Otto the persistent service is reached through **tailnet-only Tailscale Serve** at https://otto.tail09aaf9.ts.net:10003/. As with WT Builder, access is governed by Tailscale device identity and tailnet access policy; there is no separate application login. Do not expose the editor using Funnel. The process binds `127.0.0.1`; `EDITOR_ORIGIN` permits exactly the configured HTTPS tailnet origin. Unknown hosts, foreign browser origins, missing write capabilities, and cross-site requests are refused. The per-process write capability stays in browser memory and is never logged or saved.

The editor can add things, edit descriptions and stories, attach new or shared sources, scope GitHub attachments to directories, choose topics, describe directed connections, add sourced events, and preview a draft. Save writes the complete validated collection atomically and checks the revision loaded by the browser. A conflicting save keeps the draft; reload deliberately to take the saved collection. Multiple browsers can edit, but only a save based on the current revision succeeds. GitHub refresh saves a separate snapshot and never replaces a story or history event. Browser QA uses a disposable data directory and mocks GitHub refresh, never the live editor's collection.

Saves are local repository changes. Review the diff, run `npm run check`, `npm run test:browser`, and `npm run test:editor`, then commit and publish through the normal GitHub workflow. Saving in the editor does not commit, push, or deploy. Rebuild the public site to incorporate saved data; rebuild the private editor client after changing its UI. The production editor uses the built client, with no Vite development server exposed to the tailnet.

To refresh all attached public repositories, or one source:

```sh
npm run refresh:github
npm run refresh:github -- github-nnxyz
```

The importer uses the host's existing GitHub CLI access (`gh`); credentials are never returned to the editor or included in the site. It only performs GET requests against GitHub, rejects private repositories before reading their content, and projects a small allowlist of public fields. It records repository creation (not project launch), languages by code bytes, the most recently published non-draft/non-prerelease release among the first 100 returned releases, and default-branch activity. Each attached directory has its own observation. The 90-day activity window reads at most three 100-commit pages, deduplicates commit IDs, and marks full-page limits as incomplete lower bounds. Failed refreshes keep previous observations.

The public inspector and project pages show dated observations, release links, and repository language/commit evidence. Dot size defaults to Equal. Documented history uses the span between sourced event years; GitHub activity uses complete observations fetched within 14 days. Missing, stale, or incomplete evidence keeps the base dot size. Shared or overlapping scopes within one repository are not summed: the largest applicable scope count is used, a conservative display measure. Historical repository attachments do not contribute to recent activity. Commit activity describes development, not importance.

Website sources can already store a sitemap URL. Archive sources can store a public URL and blog/newsletter/podcast scope. Their indexing adapters are future work: these attachments currently provide references, not page counts or publishing activity. Sitemap `lastmod` dates will be modification evidence, not launch dates. The intended archive adapter will count distinct source items, not retrieval chunks, and preserve observed coverage.

The host service is `com.thingelstad.collection-editor`. After code changes, validate and rebuild before restarting it. Its logs are under `~/Library/Logs/collection-editor/`. A future move to another host needs a repository checkout, Node 24, `npm ci`, the private client build, GitHub CLI access for imports, and an explicit tailnet Serve origin. The JSON schema carries a version for future migrations.
