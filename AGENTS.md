# Thingelstad.xyz

Public React/Vite project gallery with a bounded AWS Bedrock guide. This is a separate application from the Thingelstad.com publishing repositories.

- Use Node 24 and `npm ci`.
- `npm run format` formats source. `npm run check` runs formatting, Oxlint, Stylelint, Knip, unit tests, TypeScript, and a production build.
- `npm run test:browser` checks the graph, navigation, index, and mocked guide at desktop, tablet, and phone sizes. Install Chromium with `npx playwright install chromium` first.
- `npm run package` builds both the static site and immutable Lambda Web Function artifact.
- Never commit or publish `research/`, credentials, generated templates, or build output. Only `dist/` is public site content; the guide bundle uses only the public catalog.
- Browser tests intercept Tinylytics and mock the guide. Do not generate live analytics visits, model calls, or quota writes to verify a change.
- GitHub Actions deploys validated pushes to `main` through a repository-scoped OIDC role. Infrastructure changes require a separately reviewed CloudFormation change set; the application delivery role cannot change IAM or invoke the guide.
- Follow parent AWS and secret-safety instructions. Preserve old hashed assets and deployment artifacts for open pages and rollback.
