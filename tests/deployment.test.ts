import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { assertCodeOnlyChangeSet } from '../scripts/deployment-safety.mjs';
import { cacheControlFor, contentTypeFor, publishOrder } from '../scripts/publish-plan.mjs';

// Shape captured from a production code-only CloudFormation change set.
const revision = {
  LogicalResourceId: 'GuideRevision',
  ResourceType: 'AWS::Lambda::WebFunctionRevision',
  Action: 'Modify',
  Replacement: 'True',
  PolicyAction: 'ReplaceAndRetain',
  Scope: ['Properties'],
  Details: [
    {
      Target: { Name: 'BuildConfig', RequiresRecreation: 'Always' },
      ChangeSource: 'ParameterReference',
      CausingEntity: 'GuideCodeKey'
    },
    {
      Target: { Name: 'BuildConfig', RequiresRecreation: 'Always' },
      ChangeSource: 'DirectModification',
      Evaluation: 'Dynamic'
    }
  ]
};
const endpoint = {
  LogicalResourceId: 'GuideEndpoint',
  ResourceType: 'AWS::Lambda::WebFunctionEndpoint',
  Action: 'Modify',
  Replacement: 'False',
  Scope: ['Properties'],
  Details: [
    {
      Target: { Name: 'RevisionWeights', RequiresRecreation: 'Never' },
      Evaluation: 'Static',
      ChangeSource: 'ResourceAttribute',
      CausingEntity: 'GuideRevision.RevisionId'
    }
  ]
};
const proposal = {
  Status: 'CREATE_COMPLETE',
  ExecutionStatus: 'AVAILABLE',
  Changes: [revision, endpoint].map((ResourceChange) => ({ ResourceChange }))
};
test('delivery permits immutable guide code and its endpoint revision dependency', () => {
  assert.doesNotThrow(() => assertCodeOnlyChangeSet(proposal));
  for (const change of [
    { ...revision, LogicalResourceId: 'GuideRole' },
    { ...revision, Replacement: 'False' },
    { ...revision, PolicyAction: 'ReplaceAndDelete' },
    { ...revision, Details: [revision.Details[1]] },
    { ...revision, Action: 'Remove' },
    { ...revision, Details: [] },
    { ...revision, Details: [{ ...revision.Details[0], CausingEntity: 'AssetsBucket' }] },
    {
      ...revision,
      Details: [{ ...revision.Details[0], Target: { Name: 'ServiceConfig', RequiresRecreation: 'Always' } }]
    },
    { ...endpoint, Replacement: 'True' },
    { ...endpoint, Details: [{ ...endpoint.Details[0], ChangeSource: 'DirectModification' }] },
    { ...endpoint, Details: [{ ...endpoint.Details[0], CausingEntity: 'AnotherRevision.RevisionId' }] },
    { ...endpoint, Details: [{ ...endpoint.Details[0], Target: { Name: 'AuthType', RequiresRecreation: 'Never' } }] }
  ]) {
    const other = change.LogicalResourceId === 'GuideEndpoint' ? revision : endpoint;
    assert.throws(() =>
      assertCodeOnlyChangeSet({ ...proposal, Changes: [change, other].map((ResourceChange) => ({ ResourceChange })) })
    );
  }
  for (const Changes of [
    [],
    [proposal.Changes[0]],
    [...proposal.Changes, proposal.Changes[0]],
    [proposal.Changes[0], proposal.Changes[0]]
  ])
    assert.throws(() => assertCodeOnlyChangeSet({ ...proposal, Changes }));
});

test('the site is published assets first, pages after, the front page last, each with its content type', () => {
  const dir = mkdtempSync(join(tmpdir(), 'site-'));
  for (const file of [
    'index.html',
    'things.json',
    'feed.xml',
    'things/elixir/index.html',
    'things/elixir.md',
    'assets/site-1.css'
  ]) {
    mkdirSync(join(dir, dirname(file)), { recursive: true });
    writeFileSync(join(dir, file), '');
  }
  const order = publishOrder(dir);
  assert.deepEqual(order, [
    'assets/site-1.css',
    'feed.xml',
    'things.json',
    'things/elixir.md',
    'things/elixir/index.html',
    'index.html'
  ]);
  assert.equal(cacheControlFor('assets/site-1.css'), 'public,max-age=31536000,immutable');
  assert.equal(cacheControlFor('things/elixir/index.html'), 'no-cache');
  assert.equal(contentTypeFor('things/elixir.md'), 'text/markdown; charset=utf-8');
  assert.equal(contentTypeFor('feed.xml'), 'application/xml; charset=utf-8');
  assert.throws(() => contentTypeFor('mystery.bin'));
});
