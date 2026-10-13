# Things I’ve built.

A React application for Jamie Thingelstad’s project collection: a white project map, browsable connections, project stories, and a grounded AI guide.

## Run locally

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The preview binds only to loopback. `npm run check` checks formatting, JavaScript/TypeScript and CSS lint, unused code, TypeScript, unit tests, and the production build. Use `npm run format` to apply formatting. `npx playwright install chromium` followed by `npm run test:browser` runs browser tests at desktop, tablet, and phone sizes. For the production build locally, run `npm run build` then `npm start`.

## Extend the collection

- `src/data/catalog.json`: public index records, including historical projects and platform features.
- `src/data/projects.ts`: six curated project stories. Add richer stories here as the collection grows.
- `src/data/connections.ts`: directed relationships, explanations, references, and graph positions. Every catalog entry appears on the map; projects without documented relationships sit in a separate area. Add both endpoints to the catalog before adding an edge.
- `research/project-inventory.json`: the broader local research inventory, including unresolved archive candidates. It contains local paths and is **not public site data**.

The public catalog contains 49 records. The research inventory contains 63 entries, including candidates, references, and the new gallery itself. Worktrees were deduplicated. Protected directories and mounted archives prevented a literally exhaustive machine-wide audit; see the inventory’s scope notes.

## AI guide

The server uses Amazon Bedrock ConverseStream with `us.anthropic.claude-haiku-4-5-20251001-v1:0` in `us-east-1`. `BEDROCK_MODEL_ID` can override the model. Credentials resolve through the existing local `cloud-engineer` profile; the server verifies account and role before invocation. No keys or credentials enter the browser.

The guide receives only public catalog records, curated stories, documented relationships, the visitor’s question, and four recent exchanges held in browser memory. It returns a validated explanation and existing project IDs. It cannot execute project tools or access local project files. Questions and answers are sent to Bedrock. This AWS account has private Bedrock invocation logging enabled, with an S3 lifecycle policy expiring those logs after 30 days. The application does not keep a conversation database or log prompts itself. Requests have size, concurrency, origin, and time bounds.

Production uses a private S3 bucket behind CloudFront, API Gateway HTTP API, and a Lambda workload role restricted to the guide’s model and anonymous daily request counter. The guide allows 100 valid attempts per UTC day across the site, with two concurrent invocations, API throttling, and a 24-second model deadline. The graph remains available when the guide is unavailable. The daily counter stores no visitor identity or conversation and expires after two days. Historical links are archive references, not claims that an old service still operates. The birthday and command previews are local illustrations; they do not call the original products.

## Analytics

Tinylytics loads once from `index.html` using embed code `jyQF-tKd4sG-MEeyxvik` with `?spa` and `defer`. The React route effect calls `window.tinylytics?.triggerUpdate?.()` after graph selection, view changes, project navigation, and browser Back. Tinylytics suppresses repeated calls for the same URL. Filtering the index does not create a view. Analytics availability does not gate rendering or navigation.

Integration checks intercept collector requests rather than writing test visits to live analytics. Follow [Tinylytics embed guidance](https://tinylytics.app/docs/getting-started/embed) when changing the integration.

## Design

Browsing is the primary mode. The homepage is the project graph, with starting points, draggable and scrollable navigation, and a project story alongside it. Selecting a connected project reveals its actual relationships; selecting an unconnected project reveals its story and other places to continue. Selection is reflected in the URL so a particular thing can be shared and browser Back retraces a browsing path. The AI guide is a collapsed, contextual companion to the selected project. It is not the homepage entry point. The index retains a small filter for finding a known project. Generated illustrations and decorative object art were removed following Jamie’s feedback. Future project imagery should favor screenshots of the actual products. The earlier image concepts remain research history, not the current visual specification. Motion respects reduced-motion preferences; graph nodes and project reveals have keyboard equivalents. Graph zoom scrolls inside its canvas on small screens, with a selector for direct access to every node.

## GitHub and delivery

Source: [jthingelstad/thingelstad.xyz](https://github.com/jthingelstad/thingelstad.xyz). GitHub Actions runs Quality, Browser, and CodeQL checks on pull requests and pushes. A passing push to `main` publishes the exact checked commit to AWS using OIDC, with no stored AWS keys. Weekly Dependabot pull requests keep npm packages and pinned GitHub Actions current.

CI blocks high-severity runtime dependency vulnerabilities. The full development audit currently reports unpatched `braces` advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) through Stylelint's glob tooling; lint uses only the fixed repository CSS path, and this tooling is excluded from production artifacts. Keep the full `npm audit` visible when reviewing dependency updates.

The local `research/` directory stays gitignored and is excluded from this public repository. No open-source license has been selected. See [DEPLOY.md](DEPLOY.md) for delivery, infrastructure updates, and rollback.
