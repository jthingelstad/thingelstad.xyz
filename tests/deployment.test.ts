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
