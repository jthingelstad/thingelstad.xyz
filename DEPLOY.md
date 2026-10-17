# Deploying thingelstad.xyz

The application stays in `/Users/otto/Projects/thingelstad.xyz`, separate from the Thingelstad.com publishing repositories. Hosting is AWS in account `999153317627`, with application resources in `us-east-1`. DNS is hosted on Namecheap BasicDNS with DNSSEC. Public delegation and authenticated DNS answers were verified on October 13, 2026.

## Resources

- `thingelstad-xyz-assets`: private versioned deployment-artifact bucket.
- `thingelstad-xyz-certificate`: ACM certificate for the apex and `www`. Its initial creation waits for external DNS validation.
- `thingelstad-xyz-site`: private versioned static bucket, CloudFront, Lambda Web Function with immutable revisions and an IAM-protected endpoint, model-specific runtime role, anonymous daily allowance table, and short-retention operational logs.
- `thingelstad-xyz-delivery`: repository-scoped GitHub OIDC application delivery role.
- Templates are generated from `infra/templates.mjs`. The certificate is separate so its external validation cannot block initial hosting deployment.
- Each stack carries the standard tags in `infra/deployment.json` `stackTags`, and CloudFormation propagates them to the resources. Change sets that omit `Tags` keep them, so delivery leaves them alone; pass them when creating a stack. Templates set no tags of their own.

## Build

```sh
npm ci
npm run package
```

This runs formatting, lint, unused-code checks, TypeScript/build/tests, generates CloudFormation templates, and bundles the production HTTP guide server. Only `dist/` is uploaded as public content. The Lambda bundle includes the public catalog and guide logic; it excludes the broader `research/` inventory. `.build/guide-key.txt` gives the immutable code artifact key.

## Publish an update

Use `cloud-engineer` in `us-east-1`. Verify STS account `999153317627` and `assumed-role/ProjectsCloudEngineer/projects-cloud-engineer` before mutation. Agents should use AWS MCP; human CLI commands below use the same profile.

1. Build and validate generated templates with cfn-lint, `infra/security.guard`, and a CloudFormation change set.
2. Upload `.build/guide.zip` to the artifacts bucket at the key in `.build/guide-key.txt`.
3. Create a change set against `thingelstad-xyz-site`, using `infra/generated/site.json`, `CAPABILITY_IAM`, the existing `AssetsBucket`, new `GuideCodeKey`, the existing `CloudFrontDomain` and `GuideOriginDomain`, and the existing `CertificateArn` (preserve it once enabled).
4. Inspect the change set and `DescribeEvents` validation results; then execute and verify the stack reaches `UPDATE_COMPLETE`.
5. Upload `dist/assets/` with `Cache-Control: public,max-age=31536000,immutable`. Upload `dist/index.html` with `Cache-Control: no-cache` and `Content-Type: text/html`. Upload the favicon with its correct SVG MIME type. Keep old hashed assets for already-open pages and rollback.
6. Invalidate `/index.html` and `/` on the stack’s distribution.
7. Verify the hosted graph, index and project navigation, asset loading, and `/api/health`. Health verifies the runtime AWS identity; it does not invoke the model or consume the daily allowance. Model and quota refusal paths have injectable local regression tests.

For client-only updates, run `npm run check`, upload new hashed assets before `dist/index.html`, invalidate `/` and `/index.html`, and verify the hosted result. No Lambda or CloudFormation update is needed when server and infrastructure code are unchanged. Intercept the Tinylytics collector during browser checks to keep test visits out of live analytics.

## Connect the custom domain

Add the two ACM validation CNAMEs from `DNS.md`; keep them for automatic certificate renewal. After ACM reaches `ISSUED` and the certificate stack completes, update the site stack’s `CertificateArn` to the certificate stack output. This enables both CloudFront aliases and HTTPS. The routing records in `DNS.md` are already present at Namecheap. Both HTTPS names and desktop/phone browsing passed on October 13, 2026; check `infra/deployment.json` for final deployment stabilization status.

Namecheap BasicDNS supports an apex `ALIAS` to the CloudFront hostname and DNSSEC. Verify that the registrar delegates to Namecheap and the parent DS matches Namecheap's keys rather than Google's old key. Do not copy CloudFront’s current IP addresses into fixed A records. `www` uses an ordinary CNAME. DNS changes are made by Jamie. Current resource IDs and verification state are in `infra/deployment.json`.

## AI operations

The production runtime uses its Lambda role, never local profiles or user credentials. `GUIDE_DAILY_LIMIT` defaults to 100 across the whole site. Every validated attempt atomically claims one daily allowance slot before model work; failures consume that attempt too. There is no application request-per-second throttle. The Web Function endpoint allows up to two execution environments, with one concurrent request per environment; Lambda can briefly exceed the environment limit during traffic shifts or fleet maintenance. Inference output is capped at 900 tokens. The 24-second deadline covers allowance and model work within the revision’s 28-second HTTP timeout. Client disconnects abort model work.

Web Functions write logs in-Region to `<group>.local` first, so the stack keeps both `/aws/lambda/thingelstad-xyz-site-guide` and its `.local` twin (14 days) and the guide role may write to both. The guide answers 200 before model work, so a model failure is visible only in its error log: the `GuideFailures` metric (namespace `ThingelstadXyz`) counts `AI guide:` error lines other than `AbortError` (client disconnects and the 24-second deadline), and `thingelstad-xyz-site-guide-failures` alarms on one in five minutes. `thingelstad-xyz-site-distribution-5xx` alarms when CloudFront returns more than 5% 5xx in two of three five-minute windows. Both alarms publish to `weekly-thing-librarian-alarms`, the Thingelstad family topic that feeds the shared `projects-ops-alerts` queue, as thingy-web's 5xx alarm does.

The guide uses the account’s existing Bedrock invocation logging policy: private request/response logs expire under a 30-day S3 lifecycle rule. The public guide explains this. Application error logs contain error names, not prompts. A change to shared Bedrock logging is an account-level operation and is not part of this deployment.

Static bucket versions and immutable code artifacts support rollback: restore the previous `index.html` version and use a previous Web Function `GuideCodeKey` to create a revision from its retained HTTP-server artifact, then invalidate the HTML paths. Previous Web Function revisions and their pinned S3 object versions are retained. Never delete a referenced object version: its revision would fail. Deleting the stacks retains the buckets and allowance table. No blog deployment or source change is included.

## GitHub Actions delivery

The `CI and deploy` workflow checks each commit with Quality, Browser, and CodeQL jobs. Only a passing push to `main` (or a manual run on `main`) reaches Deploy. Deploy checks out the same workflow commit, rebuilds from the lockfile, assumes the `thingelstad-xyz-delivery` stack's role through the account's existing GitHub OIDC provider, and runs `npm run deploy`. The role ARN is the non-secret repository variable `AWS_DEPLOY_ROLE_ARN`. Only this repository's immutable OIDC subject `repo:jthingelstad@5351/thingelstad.xyz@1417506858:ref:refs/heads/main` is trusted; PR jobs have no AWS token permission.

The role can upload this application's static assets and guide artifacts, modify only this site's stack, create guide revisions using the existing workload role, update the existing endpoint, and invalidate this site's distribution. It cannot edit IAM, invoke models, invoke Lambda, write application data, or delete objects. The deploy script compares the generated site template to the live template and accepts a change set only when `GuideCodeKey` creates a replacement immutable revision and the existing endpoint changes its revision weights through that revision dependency. Changes to runtime configuration, endpoint authentication, scaling, IAM, or CloudFront remain refused. Infrastructure changes must therefore be reviewed and deployed separately through `cloud-engineer` before application delivery resumes.

The Lambda ZIP normalizes timestamps and omits extra file attributes so repeated unchanged builds reuse an immutable artifact key. Delivery skips unchanged guide code. Hashed assets are uploaded before HTML and retained. CloudFront invalidation must finish; production HTML must match the built bytes, and read-only API health must pass before the job succeeds. Deployments serialize without canceling an active release.

For rollback, revert the problematic commit on `main`. The same checks and verification apply. Delivery checks the current main revision before publishing, so stale workflow reruns cannot overwrite a newer release. To change the delivery role itself, regenerate and separately deploy `infra/generated/delivery.json` with reviewed CloudFormation validation and `CAPABILITY_IAM`.

Live bootstrap calls to `DescribeEvents` were denied with stack/change-set ARN permissions despite a positive IAM simulation. Delivery grants this single read-only action with `Resource: *`, restricted to `us-east-1`; the script explicitly targets this site's stack on every query. Mutating permissions remain scoped to this application.

CloudFormation resolves and passes the guide's existing workload role when creating each revision. Delivery has `iam:GetRole` and `iam:PassRole` for that one runtime role, restricted to the Lambda service, with no IAM mutation permission. The artifact bucket grants the Lambda service versioned reads of this guide's immutable ZIP files, restricted to this account and Web Function. CloudFront signs guide requests using OAC; the endpoint accepts only IAM-authorized requests. Its resource policy grants invocation to this site's distribution.

The pinned cfn-lint IAM action list predates Web Functions. Only the delivery role suppresses W3037 for those actions, which are checked against the live CloudFormation resource handler schemas and change-set validation. All resource property and other IAM checks remain enabled.

## Initial Web Function migration

The migration uses separate reviewed change sets, outside application delivery:

1. Add the restricted guide artifact bucket policy to the assets stack.
2. Add the Web Function, revision, IAM endpoint, resource policy, and CloudFront OAC alongside the existing Event Function/API Gateway resources. Route only `/api/health` to the new backend, leaving `/api/explore` on the existing guide. Preserve the stack's current `GuideCodeKey` for the old guide during this step by replacing its Code reference with that immutable key in the temporary bootstrap template.
3. Verify the CloudFront health route, runtime identity, and unsigned direct-endpoint rejection without model or quota writes.
4. Once the endpoint is known, set `GuideOriginDomain` to its hostname. The bootstrap distribution uses its endpoint attribute while the final template pins that hostname. Apply the final site template: route all `/api/*` traffic to the Web Function and remove the Event Function/API Gateway resources. Preserve the bucket, table, role, logs, distribution, and certificate.
5. Separately update the delivery role and remove its API Gateway/Event Function permissions. Verify a code-only change set against the live stack before enabling normal delivery.

A pre-migration Event Function artifact cannot run as a Web Function. To roll back the migration itself, restore the previous site and delivery templates and the previous Event Function `GuideCodeKey`; routine Web Function rollback uses an HTTP-server artifact. Keep bootstrap and pre-migration templates in ignored `.build/` only. The `CloudFrontDomain` parameter uses the existing distribution hostname so allowed origins do not create a circular dependency between the revision and distribution. The `GuideOriginDomain` parameter pins the existing endpoint hostname for CloudFront; the access policy constructs the stable `prod` endpoint ARN from the Web Function ARN. This avoids indirect CloudFront and resource-policy updates on every revision rollout, keeping application delivery free of CDN configuration and access-policy mutation permissions. Changing endpoint identity requires a separately reviewed infrastructure change. Static hosting and DNS are unchanged.
