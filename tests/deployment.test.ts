import { test } from 'node:test';
import assert from 'node:assert/strict';
// Deployment script is JavaScript so it also runs without tsx on GitHub runners.
import { assertCodeOnlyChangeSet } from '../scripts/deployment-safety.mjs';

const proposal = {
  Status: 'CREATE_COMPLETE',
  ExecutionStatus: 'AVAILABLE',
  Changes: [
    {
      ResourceChange: {
        LogicalResourceId: 'Guide',
        ResourceType: 'AWS::Lambda::Function',
        Action: 'Modify',
        Replacement: 'False',
        Scope: ['Properties'],
        Details: [{ Target: { Name: 'Code', RequiresRecreation: 'Never' } }]
      }
    }
  ]
};
test('delivery permits only a reviewed Lambda code update', () => {
  assert.doesNotThrow(() => assertCodeOnlyChangeSet(proposal));
  for (const mutation of [
    { LogicalResourceId: 'GuideRole' },
    { Replacement: 'True' },
    { Action: 'Remove' },
    { Details: [{ Target: { Name: 'Role', RequiresRecreation: 'Never' } }] },
    { Details: [] }
  ]) {
    assert.throws(() =>
      assertCodeOnlyChangeSet({
        ...proposal,
        Changes: [{ ResourceChange: { ...proposal.Changes[0].ResourceChange, ...mutation } }]
      })
    );
  }
  assert.throws(() => assertCodeOnlyChangeSet({ ...proposal, Changes: [] }));
  assert.throws(() => assertCodeOnlyChangeSet({ ...proposal, Changes: [...proposal.Changes, ...proposal.Changes] }));
});

// Shape captured from the first real AWS change set: this is an indirect ARN
// dependency, not an API routing edit. Direct edits must remain refused.
const integration = {
  LogicalResourceId: 'Integration',
  ResourceType: 'AWS::ApiGatewayV2::Integration',
  Action: 'Modify',
  Replacement: 'False',
  Scope: ['Properties'],
  Details: [
    {
      Target: { Name: 'IntegrationUri', RequiresRecreation: 'Never' },
      Evaluation: 'Dynamic',
      ChangeSource: 'ResourceAttribute',
      CausingEntity: 'Guide.Arn'
    }
  ]
};
test('delivery accepts only the existing integration dependency on the unchanged guide ARN', () => {
  const changes = [...proposal.Changes, { ResourceChange: integration }];
  assert.doesNotThrow(() => assertCodeOnlyChangeSet({ ...proposal, Changes: changes }));
  for (const mutation of [
    { ChangeSource: 'DirectModification' },
    { Evaluation: 'Static' },
    { CausingEntity: 'AnotherFunction.Arn' },
    { Target: { Name: 'ApiId', RequiresRecreation: 'Never' } }
  ]) {
    const changed = { ...integration, Details: [{ ...integration.Details[0], ...mutation }] };
    assert.throws(() =>
      assertCodeOnlyChangeSet({ ...proposal, Changes: [...proposal.Changes, { ResourceChange: changed }] })
    );
  }
  assert.throws(() => assertCodeOnlyChangeSet({ ...proposal, Changes: [{ ResourceChange: integration }] }));
});
