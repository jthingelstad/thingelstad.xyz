export function assertCodeOnlyChangeSet(proposal) {
  if (
    proposal.Status !== 'CREATE_COMPLETE' ||
    proposal.ExecutionStatus !== 'AVAILABLE' ||
    proposal.Changes?.length !== 2
  )
    throw new Error('Expected an executable guide revision and endpoint update.');
  const resources = proposal.Changes.map((change) => change.ResourceChange);
  if (new Set(resources.map((change) => change?.LogicalResourceId)).size !== 2)
    throw new Error('Expected exactly one guide revision and endpoint update.');
  for (const change of resources) {
    if (
      change?.Action !== 'Modify' ||
      change.Scope?.length !== 1 ||
      change.Scope[0] !== 'Properties' ||
      !change.Details?.length
    )
      throw new Error('Delivery refuses infrastructure changes.');
    // The caller first proves the live template equals the checked source, then changes only GuideCodeKey.
    // CloudFormation reports both a parameter reference and a dynamic change for nested BuildConfig.
    const revision =
      change.LogicalResourceId === 'GuideRevision' &&
      change.ResourceType === 'AWS::Lambda::WebFunctionRevision' &&
      change.Replacement === 'True' &&
      change.PolicyAction === 'ReplaceAndRetain' &&
      change.Details.some(
        (detail) => detail.ChangeSource === 'ParameterReference' && detail.CausingEntity === 'GuideCodeKey'
      ) &&
      change.Details.every(
        (detail) =>
          detail.Target?.Name === 'BuildConfig' &&
          detail.Target?.RequiresRecreation === 'Always' &&
          ((detail.ChangeSource === 'ParameterReference' && detail.CausingEntity === 'GuideCodeKey') ||
            (detail.ChangeSource === 'DirectModification' && detail.Evaluation === 'Dynamic' && !detail.CausingEntity))
      );
    const endpoint =
      change.LogicalResourceId === 'GuideEndpoint' &&
      change.ResourceType === 'AWS::Lambda::WebFunctionEndpoint' &&
      change.Replacement === 'False' &&
      change.Details.every(
        (detail) =>
          detail.Target?.Name === 'RevisionWeights' &&
          detail.Target?.RequiresRecreation === 'Never' &&
          ['Static', 'Dynamic'].includes(detail.Evaluation) &&
          detail.ChangeSource === 'ResourceAttribute' &&
          detail.CausingEntity === 'GuideRevision.RevisionId'
      );
    if (!revision && !endpoint)
      throw new Error('Delivery refuses changes outside guide code and its revision routing.');
  }
}
