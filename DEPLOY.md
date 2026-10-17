# Deploying thingelstad.xyz

The application stays in `/Users/otto/Projects/thingelstad.xyz`, separate from the Thingelstad.com publishing repositories. Hosting is AWS in account `999153317627`, with application resources in `us-east-1`. DNS is hosted on Namecheap BasicDNS with DNSSEC. Public delegation and authenticated DNS answers were verified on October 13, 2026.

## Resources

- `thingelstad-xyz-certificate`: ACM certificate for the apex and `www`. Its initial creation waits for external DNS validation.
- `thingelstad-xyz-site`: private versioned static bucket, CloudFront distribution with an Origin Access Control, a response headers policy, the directory-index CloudFront Function, and a 5xx alarm.
- `thingelstad-xyz-delivery`: repository-scoped GitHub OIDC application delivery role.
- Templates are generated from `infra/templates.mjs` by `npm run templates` into the gitignored `infra/generated/`. The certificate is separate so its external validation cannot block hosting changes.
- Each stack carries the standard tags in `infra/deployment.json` `stackTags`, and CloudFormation propagates them to the resources. Change sets that omit `Tags` keep them; pass them when creating a stack. Templates set no tags of their own.
- `thingelstad-xyz-assets`, the deployment-artifact bucket for the retired guide, was removed with the guide (see below).

## Build

```sh
npm ci
npm run check
npm run templates
```

`npm run check` runs formatting, lint, unused-code checks, TypeScript, unit tests, and the Eleventy build into `_site/`. Only `_site/` is uploaded. Nothing from `research/` is part of the build.

## Publish an update

Pushing to `main` publishes (see GitHub Actions delivery below). To publish by hand, use `cloud-engineer` in `us-east-1`. Verify STS account `999153317627` and `assumed-role/ProjectsCloudEngineer/projects-cloud-engineer` before mutation. Agents use AWS MCP; human CLI commands use the same profile.

1. Build. If `infra/templates.mjs` changed, validate the generated templates with cfn-lint, `infra/security.guard`, and a CloudFormation change set against the stack; inspect, execute, and wait for `UPDATE_COMPLETE`. Only then may the code change merge: the deploy refuses to publish while the live template differs from the generated one.
2. Upload `_site/` in the order `scripts/publish-plan.mjs` gives: `assets/` (content-hashed stylesheet, script, and fonts) with `Cache-Control: public,max-age=31536000,immutable`, then the other files and pages with `Cache-Control: no-cache`, the front page last. Every object gets an explicit content type with charset (`.md` is `text/markdown`). Keep old assets for already-open pages and rollback; nothing is deleted.
3. Invalidate `/*` on the stack’s distribution.
4. Verify the front page and a thing page match the built bytes and a missing page returns 404.

Intercept the Tinylytics collector during browser checks to keep test visits out of live analytics.

## Directory URLs and the 404 page

The site is a tree of directories, each holding an `index.html`, and S3 behind Origin Access Control does not serve directory indexes. The distribution's default behavior runs the `thingelstad-xyz-site-directory-index` CloudFront Function (cloudfront-js-2.0, viewer request): a URI ending in `/` gets `index.html` appended, a URI whose last segment has no dot is redirected (301) to its slash form, and anything with a dot passes through. A missing object is a 403 from S3 (CloudFront has no `ListBucket`), so both 403 and 404 are mapped to `/404.html` with a 404 status and a 10-second error cache. Both were added through the reviewed change set `cloud-engineer-directory-index-20261017` on October 17, 2026.

## Connect the custom domain

Add the two ACM validation CNAMEs from `DNS.md`; keep them for automatic certificate renewal. After ACM reaches `ISSUED` and the certificate stack completes, update the site stack’s `CertificateArn` to the certificate stack output. This enables both CloudFront aliases and HTTPS. The routing records in `DNS.md` are already present at Namecheap. Both HTTPS names and desktop/phone browsing passed on October 13, 2026; `infra/deployment.json` records the state.

Namecheap BasicDNS supports an apex `ALIAS` to the CloudFront hostname and DNSSEC. Do not copy CloudFront’s current IP addresses into fixed A records. `www` uses an ordinary CNAME. DNS changes are made by Jamie. Current resource IDs and verification state are in `infra/deployment.json`.

## Operations

`thingelstad-xyz-site-distribution-5xx` alarms when CloudFront returns more than 5% 5xx in two of three five-minute windows. It publishes to `weekly-thing-librarian-alarms`, the Thingelstad family topic that feeds the shared `projects-ops-alerts` queue, as thingy-web's 5xx alarm does. There is no application runtime: the site is files in a bucket.

The site bucket is versioned, so rollback is restoring the previous object versions (or reverting the commit on `main` and letting delivery republish) and invalidating. Never delete objects; old hashed assets serve already-open pages.

## GitHub Actions delivery

The `CI and deploy` workflow checks each commit with Quality, Browser, and CodeQL jobs. Only a passing push to `main` (or a manual run on `main`) reaches Deploy. Deploy checks out the same workflow commit, rebuilds from the lockfile, assumes the `thingelstad-xyz-delivery` stack's role through the account's existing GitHub OIDC provider, and runs `npm run deploy`. The role ARN is the non-secret repository variable `AWS_DEPLOY_ROLE_ARN`. Only this repository's immutable OIDC subject `repo:jthingelstad@5351/thingelstad.xyz@1417506858:ref:refs/heads/main` is trusted; PR jobs have no AWS token permission.

The role can list, read, and write the site bucket, create and read invalidations on this site's distribution, and read (`DescribeStacks`, `GetTemplate`) this site's stack. It cannot change CloudFormation, IAM, or CloudFront configuration, and it cannot delete objects. `scripts/deploy.mjs` checks the runtime identity, requires the stack to be in a complete state, compares the generated site template to the live template and stops if they differ, uploads in the publish-plan order, invalidates `/*`, waits for the invalidation, and verifies the front page, one thing page, and a 404 against the built bytes. Deployments serialize without canceling an active release, and delivery checks the current `main` revision before publishing, so stale workflow reruns cannot overwrite a newer release.

To change the delivery role itself, regenerate `infra/generated/delivery.json`, review it with cfn-lint and a change set, and apply it with `CAPABILITY_IAM` through `cloud-engineer`.

## Retiring the AI guide (October 17, 2026)

The guide (a Lambda Web Function calling Bedrock, a DynamoDB daily allowance table, two log groups, a failure metric and alarm, a runtime role, a resource policy, and a CloudFront origin plus `/api/*` behavior) was removed in reviewed change sets, in this order, before the code that drops it from `infra/templates.mjs` merged:

1. `cloud-engineer-retire-guide-step1-20261017` on `thingelstad-xyz-site`: switched the allowance table, both log groups, and the Web Function revision from `Retain` to `Delete` policies. CloudFormation applies the policy from the last template that declared a resource, so this had to land as its own update.
2. `cloud-engineer-retire-guide-step2-20261017` on `thingelstad-xyz-site`: the static-site template. Removes the eleven guide resources, the `api` origin, and the `/api/*` behavior; the distribution keeps its aliases, certificate, headers policy, directory-index function, and error pages. The only parameter left is `CertificateArn`.
3. `thingelstad-xyz-assets` stack deletion. The bucket `thingelstad-xyz-assets-assetsbucket-p9dnw4dc1dcv` has `Retain` and is kept with the old guide ZIPs until Jamie decides to empty and delete it.
4. `cloud-engineer-delivery-shrink-20261017` on `thingelstad-xyz-delivery`: the role loses the assets bucket, change-set, `DescribeEvents`, IAM, and Lambda permissions described above.

Bedrock invocation logging is an account-level setting and was not part of this retirement. The host-side editor service `com.thingelstad.collection-editor` and its Tailscale Serve mapping on port 10003 were removed from Otto the same day.
