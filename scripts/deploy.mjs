import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { assertCodeOnlyChangeSet } from './deployment-safety.mjs';

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
const codeKey = readFileSync('.build/guide-key.txt', 'utf8').trim();
if (!/^guide\/[a-f0-9]{64}\.zip$/.test(codeKey)) throw new Error('Invalid immutable guide artifact key.');
if (stack.Parameters.find((parameter) => parameter.ParameterKey === 'GuideCodeKey')?.ParameterValue !== codeKey) {
  run('s3', 'cp', '.build/guide.zip', `s3://${deployment.assetsBucket}/${codeKey}`, '--only-show-errors');
  const name = `github-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`;
  const parameters = stack.Parameters.map((parameter) =>
    parameter.ParameterKey === 'GuideCodeKey'
      ? { ParameterKey: parameter.ParameterKey, ParameterValue: codeKey }
      : { ParameterKey: parameter.ParameterKey, UsePreviousValue: true }
  );
  const changeSet = aws(
    'cloudformation',
    'create-change-set',
    '--stack-name',
    stackName,
    '--change-set-name',
    name,
    '--change-set-type',
    'UPDATE',
    '--use-previous-template',
    '--capabilities',
    'CAPABILITY_IAM',
    '--parameters',
    JSON.stringify(parameters)
  );
  run('cloudformation', 'wait', 'change-set-create-complete', '--change-set-name', changeSet.Id);
  const proposal = aws('cloudformation', 'describe-change-set', '--change-set-name', changeSet.Id);
  assertCodeOnlyChangeSet(proposal);
  const events = aws('cloudformation', 'describe-events', '--change-set-name', changeSet.Id).OperationEvents ?? [];
  if (events.some((event) => event.EventType === 'VALIDATION_ERROR' || event.ValidationStatus === 'FAILED')) {
    throw new Error('CloudFormation validation failed.');
  }
  run('cloudformation', 'execute-change-set', '--change-set-name', changeSet.Id);
  run('cloudformation', 'wait', 'stack-update-complete', '--stack-name', stackName);
  console.log('Guide code update complete.');
}

// Publish hashed assets first, HTML last. Keep previous assets for open tabs and rollback.
run(
  's3',
  'sync',
  'dist/assets/',
  `s3://${deployment.siteBucket}/assets/`,
  '--cache-control',
  'public,max-age=31536000,immutable',
  '--only-show-errors'
);
for (const entry of readdirSync('dist', { withFileTypes: true })) {
  if (entry.isFile() && entry.name !== 'index.html') {
    run(
      's3',
      'cp',
      `dist/${entry.name}`,
      `s3://${deployment.siteBucket}/${entry.name}`,
      '--cache-control',
      'no-cache',
      '--only-show-errors'
    );
  }
}
run(
  's3',
  'cp',
  'dist/index.html',
  `s3://${deployment.siteBucket}/index.html`,
  '--cache-control',
  'no-cache',
  '--content-type',
  'text/html; charset=utf-8',
  '--only-show-errors'
);
const invalidation = aws(
  'cloudfront',
  'create-invalidation',
  '--distribution-id',
  deployment.distributionId,
  '--paths',
  '/',
  '/index.html'
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
const expectedHash = createHash('sha256').update(readFileSync('dist/index.html')).digest('hex');
let verified = false;
for (let attempt = 0; attempt < 6; attempt++) {
  const response = await fetch(deployment.publishedUrl, { signal: AbortSignal.timeout(15_000) });
  const actualHash = createHash('sha256')
    .update(Buffer.from(await response.arrayBuffer()))
    .digest('hex');
  if (response.ok && actualHash === expectedHash) {
    verified = true;
    break;
  }
  await delay(5000);
}
if (!verified) throw new Error('Published HTML does not match this build.');
const health = await fetch(new URL('/api/health', deployment.publishedUrl), { signal: AbortSignal.timeout(15_000) });
if (!health.ok || !(await health.json()).ok) throw new Error('Production guide health failed.');
console.log(`Verified ${process.env.GITHUB_SHA} at ${deployment.publishedUrl}`);
