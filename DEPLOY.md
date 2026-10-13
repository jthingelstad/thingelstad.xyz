# Deploying thingelstad.xyz

The application stays in `/Users/otto/Projects/thingelstad.xyz`, separate from the Thingelstad.com publishing repositories. Hosting is AWS in account `999153317627`, with application resources in `us-east-1`. DNS is hosted on Namecheap BasicDNS with DNSSEC. Public delegation and authenticated DNS answers were verified on October 13, 2026.

## Resources

- `thingelstad-xyz-assets`: private versioned deployment-artifact bucket.
- `thingelstad-xyz-certificate`: ACM certificate for the apex and `www`. Its initial creation waits for external DNS validation.
- `thingelstad-xyz-site`: private versioned static bucket, CloudFront, HTTP API, Lambda, model-specific runtime role, anonymous daily allowance table, and short-retention operational logs.
- `thingelstad-xyz-delivery`: repository-scoped GitHub OIDC application delivery role.
- Templates are generated from `infra/templates.mjs`. The certificate is separate so its external validation cannot block initial hosting deployment.

## Build

```sh
npm ci
npm run package
```

This runs formatting, lint, unused-code checks, TypeScript/build/tests, generates CloudFormation templates, and bundles the production guide. Only `dist/` is uploaded as public content. The Lambda bundle includes the public catalog and guide logic; it excludes the broader `research/` inventory. `.build/guide-key.txt` gives the immutable code artifact key.

## Publish an update

Use `cloud-engineer` in `us-east-1`. Verify STS account `999153317627` and `assumed-role/ProjectsCloudEngineer/projects-cloud-engineer` before mutation. Agents should use AWS MCP; human CLI commands below use the same profile.

1. Build and validate generated templates with cfn-lint, `infra/security.guard`, and a CloudFormation change set.
2. Upload `.build/guide.zip` to the artifacts bucket at the key in `.build/guide-key.txt`.
3. Create a change set against `thingelstad-xyz-site`, using `infra/generated/site.json`, `CAPABILITY_IAM`, the existing `AssetsBucket`, new `GuideCodeKey`, and the existing `CertificateArn` (preserve it once enabled).
4. Inspect the change set and `DescribeEvents` validation results; then execute and verify the stack reaches `UPDATE_COMPLETE`.
5. Upload `dist/assets/` with `Cache-Control: public,max-age=31536000,immutable`. Upload `dist/index.html` with `Cache-Control: no-cache` and `Content-Type: text/html`. Upload the favicon with its correct SVG MIME type. Keep old hashed assets for already-open pages and rollback.
6. Invalidate `/index.html` and `/` on the stack’s distribution.
7. Verify the hosted graph, index and project navigation, asset loading, and `/api/health`. Health verifies the runtime AWS identity; it does not invoke the model or consume the daily allowance. Model and quota refusal paths have injectable local regression tests.

For client-only updates, run `npm run check`, upload new hashed assets before `dist/index.html`, invalidate `/` and `/index.html`, and verify the hosted result. No Lambda or CloudFormation update is needed when server and infrastructure code are unchanged. Intercept the Tinylytics collector during browser checks to keep test visits out of live analytics.

## Connect the custom domain

Add the two ACM validation CNAMEs from `DNS.md`; keep them for automatic certificate renewal. After ACM reaches `ISSUED` and the certificate stack completes, update the site stack’s `CertificateArn` to the certificate stack output. This enables both CloudFront aliases and HTTPS. The routing records in `DNS.md` are already present at Namecheap. Both HTTPS names and desktop/phone browsing passed on October 13, 2026; check `infra/deployment.json` for final deployment stabilization status.

Namecheap BasicDNS supports an apex `ALIAS` to the CloudFront hostname and DNSSEC. Verify that the registrar delegates to Namecheap and the parent DS matches Namecheap's keys rather than Google's old key. Do not copy CloudFront’s current IP addresses into fixed A records. `www` uses an ordinary CNAME. DNS changes are made by Jamie. Current resource IDs and verification state are in `infra/deployment.json`.

## AI operations

The production runtime uses its Lambda role, never local profiles or user credentials. `GUIDE_DAILY_LIMIT` defaults to 100 across the whole site. Every validated attempt atomically claims one daily allowance slot before model work; failures consume that attempt too. API Gateway throttles at one request per second with burst four, Lambda concurrency is two, and inference output is capped at 900 tokens. The model deadline is 24 seconds within the HTTP API’s timeout.

The guide uses the account’s existing Bedrock invocation logging policy: private request/response logs expire under a 30-day S3 lifecycle rule. The public guide explains this. Application error logs contain error names, not prompts. A change to shared Bedrock logging is an account-level operation and is not part of this deployment.

Static bucket versions and immutable code artifacts support rollback: restore the previous `index.html` version and use the previous `GuideCodeKey`, then invalidate the HTML paths. Deleting the stacks retains the buckets and allowance table. No blog deployment or source change is included.

## GitHub Actions delivery

The `CI and deploy` workflow checks each commit with Quality, Browser, and CodeQL jobs. Only a passing push to `main` (or a manual run on `main`) reaches Deploy. Deploy checks out the same workflow commit, rebuilds from the lockfile, assumes the `thingelstad-xyz-delivery` stack's role through the account's existing GitHub OIDC provider, and runs `npm run deploy`. The role ARN is the non-secret repository variable `AWS_DEPLOY_ROLE_ARN`. Only this repository's `refs/heads/main` OIDC subject is trusted; PR jobs have no AWS token permission.

The role can upload this application's static assets and guide artifacts, modify only this site's stack and Lambda code, and invalidate this site's distribution. It cannot edit IAM, invoke models, invoke Lambda, write application data, or delete objects. The deploy script compares the generated site template to the live template and accepts a change set only when its sole change modifies the guide's Code without replacement. Infrastructure changes must therefore be reviewed and deployed separately through `cloud-engineer` before application delivery resumes.

The Lambda ZIP normalizes timestamps and omits extra file attributes so repeated unchanged builds reuse an immutable artifact key. Delivery skips unchanged guide code. Hashed assets are uploaded before HTML and retained. CloudFront invalidation must finish; production HTML must match the built bytes, and read-only API health must pass before the job succeeds. Deployments serialize without canceling an active release.

For rollback, revert the problematic commit on `main`. The same checks and verification apply. Delivery checks the current main revision before publishing, so stale workflow reruns cannot overwrite a newer release. To change the delivery role itself, regenerate and separately deploy `infra/generated/delivery.json` with reviewed CloudFormation validation and `CAPABILITY_IAM`.
