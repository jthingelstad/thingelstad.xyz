import { execFile, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { isDeepStrictEqual, promisify } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { cacheControlFor, contentTypeFor, publishOrder, publishSteps, unpublished } from './publish-plan.mjs';
import { builtPageHashes, changedUrls, pingIndexNow } from './indexnow.mjs';

// AWS CLI runs only on the authenticated GitHub runner. Local agent deployments use AWS MCP.
const deployment = JSON.parse(readFileSync('infra/deployment.json', 'utf8'));
if (process.env.GITHUB_REPOSITORY !== 'jthingelstad/thingelstad.xyz' || process.env.GITHUB_REF !== 'refs/heads/main') {
  throw new Error('Application delivery runs only from this repository main branch.');
}
const run = (...args) =>
  execFileSync('aws', [...args, '--region', deployment.region, '--no-cli-pager'], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  }).trim();
const aws = (...args) => JSON.parse(run(...args, '--output', 'json'));
const identity = aws('sts', 'get-caller-identity');
const roleName = process.env.AWS_DEPLOY_ROLE_ARN?.split('/').at(-1);
if (identity.Account !== deployment.account || !roleName || !identity.Arn.includes(`:assumed-role/${roleName}/`)) {
  throw new Error('Unexpected AWS deployment identity.');
}
const stackName = deployment.stacks.site;
const stack = aws('cloudformation', 'describe-stacks', '--stack-name', stackName).Stacks[0];
if (!['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE'].includes(stack.StackStatus)) {
  throw new Error(`Stack is not ready: ${stack.StackStatus}`);
}
const liveTemplate = aws('cloudformation', 'get-template', '--stack-name', stackName).TemplateBody;
const expectedTemplate = JSON.parse(readFileSync('infra/generated/site.json', 'utf8'));
if (!isDeepStrictEqual(typeof liveTemplate === 'string' ? JSON.parse(liveTemplate) : liveTemplate, expectedTemplate)) {
  throw new Error(
    'Infrastructure differs from the live template. Deploy the reviewed infrastructure change separately first.'
  );
}
// Publish the built site: content-addressed assets first, then files, then pages, the front page last.
// Nothing is deleted. Previous assets stay for open tabs and for rollback by restoring an object version.
const siteRoot = '_site';
const keys = publishOrder(siteRoot);
if (
  ['index.html', '404.html', 'things.json', 'search/index.html', 'pagefind/pagefind.js'].some(
    (key) => !keys.includes(key)
  )
) {
  throw new Error('The site build is incomplete.');
}
// Before uploading, note which sitemap pages this deploy changes (new, or bytes that differ from the live object),
// for the IndexNow ping after it is verified. A failed listing only skips the ping.
const sitemapXml = readFileSync(`${siteRoot}/sitemap.xml`, 'utf8');
let changedPages = null;
try {
  const listing = aws(
    's3api',
    'list-objects-v2',
    '--bucket',
    deployment.siteBucket,
    '--query',
    "Contents[?ends_with(Key, 'index.html')].[Key, ETag]"
  );
  changedPages = changedUrls({
    sitemapXml,
    siteUrl: deployment.publishedUrl,
    built: builtPageHashes(siteRoot, sitemapXml, deployment.publishedUrl),
    live: new Map(listing ?? [])
  });
} catch (error) {
  console.log(`IndexNow: could not list the live pages (${error.message}); no ping this deploy.`);
}
// Content-named files the bucket already holds are not sent again. A failed listing only means everything is sent.
let live = new Map();
try {
  live = new Map(
    aws(
      's3api',
      'list-objects-v2',
      '--bucket',
      deployment.siteBucket,
      '--query',
      "Contents[?starts_with(Key, 'assets/') || starts_with(Key, 'pagefind/')].[Key, Size]"
    ) ?? []
  );
} catch (error) {
  console.log(`Could not list the published assets (${error.message}); sending every file.`);
}
const sizes = new Map(keys.map((key) => [key, statSync(`${siteRoot}/${key}`).size]));
const pending = unpublished(keys, sizes, live);
const send = promisify(execFile);
const upload = (key) =>
  send(
    'aws',
    [
      's3',
      'cp',
      `${siteRoot}/${key}`,
      `s3://${deployment.siteBucket}/${key}`,
      '--cache-control',
      cacheControlFor(key),
      '--content-type',
      contentTypeFor(key),
      '--only-show-errors',
      '--region',
      deployment.region,
      '--no-cli-pager'
    ],
    { maxBuffer: 10 * 1024 * 1024 }
  );
// One step after another, eight files of a step at a time. A failed upload stops the deploy before the next step.
for (const step of publishSteps(pending)) {
  const queue = [...step];
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      for (let key = queue.shift(); key !== undefined; key = queue.shift()) await upload(key);
    })
  );
}
console.log(
  `Uploaded ${pending.length} files; ${keys.length - pending.length} content-named files were already published.`
);
const invalidation = aws(
  'cloudfront',
  'create-invalidation',
  '--distribution-id',
  deployment.distributionId,
  '--paths',
  '/*'
);
run(
  'cloudfront',
  'wait',
  'invalidation-completed',
  '--distribution-id',
  deployment.distributionId,
  '--id',
  invalidation.Invalidation.Id
);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const published = async (path) => {
  const response = await fetch(new URL(path, deployment.publishedUrl), { signal: AbortSignal.timeout(15_000) });
  return { ok: response.ok, hash: sha256(Buffer.from(await response.arrayBuffer())) };
};
// The front page and one page below the root, which also proves the directory-index rewrite is live.
const checks = ['index.html', keys.find((key) => /^things\/[^/]+\/index\.html$/.test(key))].map((key) => ({
  key,
  path: '/' + key.replace(/index\.html$/, ''),
  hash: sha256(readFileSync(`${siteRoot}/${key}`))
}));
let verified = false;
for (let attempt = 0; attempt < 6 && !verified; attempt++) {
  const results = await Promise.all(checks.map((check) => published(check.path)));
  verified = results.every((result, i) => result.ok && result.hash === checks[i].hash);
  if (!verified) await delay(5000);
}
if (!verified) throw new Error('Published pages do not match this build.');
const missing = await fetch(new URL('/things/not-a-thing/', deployment.publishedUrl), {
  signal: AbortSignal.timeout(15_000)
});
if (missing.status !== 404) throw new Error(`Expected 404 for a missing page, got ${missing.status}.`);
console.log(`Verified ${process.env.GITHUB_SHA} at ${deployment.publishedUrl}`);
// Tell IndexNow which pages changed. It never fails the deploy (scripts/indexnow.mjs).
if (changedPages) console.log(await pingIndexNow(changedPages, deployment.publishedUrl));
