export function assertCodeOnlyChangeSet(proposal) {
  if (
    proposal.Status !== 'CREATE_COMPLETE' ||
    proposal.ExecutionStatus !== 'AVAILABLE' ||
    !proposal.Changes?.length ||
    proposal.Changes.length > 2
  ) {
    throw new Error('Expected an executable Lambda code change.');
  }
  const resources = proposal.Changes.map((change) => change.ResourceChange);
  if (resources.filter((change) => change?.LogicalResourceId === 'Guide').length !== 1) {
    throw new Error('Expected exactly one guide code update.');
  }
  for (const change of resources) {
    if (
      change?.Action !== 'Modify' ||
      change.Replacement !== 'False' ||
      change.Scope?.length !== 1 ||
      change.Scope[0] !== 'Properties' ||
      !change.Details?.length
    ) {
      throw new Error('Delivery refuses infrastructure changes or resource replacement.');
    }
    const code =
      change.LogicalResourceId === 'Guide' &&
      change.ResourceType === 'AWS::Lambda::Function' &&
      change.Details.every((detail) => detail.Target?.Name === 'Code' && detail.Target?.RequiresRecreation === 'Never');
    // CloudFormation also reports consumers of Guide.Arn as dynamic dependencies,
    // even though a code-only update preserves the function ARN and integration URI.
    const dependency =
      change.LogicalResourceId === 'Integration' &&
      change.ResourceType === 'AWS::ApiGatewayV2::Integration' &&
      change.Details.every(
        (detail) =>
          detail.Target?.Name === 'IntegrationUri' &&
          detail.Target?.RequiresRecreation === 'Never' &&
          detail.Evaluation === 'Dynamic' &&
          detail.ChangeSource === 'ResourceAttribute' &&
          detail.CausingEntity === 'Guide.Arn'
      );
    if (!code && !dependency)
      throw new Error('Delivery refuses changes outside guide code and its existing ARN dependency.');
  }
}
