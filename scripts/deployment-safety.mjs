export function assertCodeOnlyChangeSet(proposal) {
  if (
    proposal.Status !== 'CREATE_COMPLETE' ||
    proposal.ExecutionStatus !== 'AVAILABLE' ||
    proposal.Changes?.length !== 1
  ) {
    throw new Error('Expected exactly one executable Lambda code change.');
  }
  const change = proposal.Changes[0].ResourceChange;
  if (
    change?.LogicalResourceId !== 'Guide' ||
    change.ResourceType !== 'AWS::Lambda::Function' ||
    change.Action !== 'Modify' ||
    change.Replacement !== 'False' ||
    change.Scope?.some((scope) => scope !== 'Properties') ||
    !change.Details?.length ||
    change.Details.some((detail) => detail.Target?.Name !== 'Code' || detail.Target?.RequiresRecreation !== 'Never')
  ) {
    throw new Error('Delivery refuses infrastructure changes or resource replacement.');
  }
}
