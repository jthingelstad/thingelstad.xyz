import { writeFileSync, mkdirSync } from 'node:fs';
const ref = (name) => ({ Ref: name });
const sub = (value) => ({ 'Fn::Sub': value });
const get = (name, field) => ({ 'Fn::GetAtt': [name, field] });
const yes = (a, b) => ({ 'Fn::If': ['CustomDomain', a, b] });
const bucket = () => ({
  Type: 'AWS::S3::Bucket',
  DeletionPolicy: 'Retain',
  UpdateReplacePolicy: 'Retain',
  Properties: {
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true
    },
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [{ ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }]
    },
    VersioningConfiguration: { Status: 'Enabled' }
  }
});
const output = (value) => ({ Value: value, Description: 'Deployment resource' });
const wrap = (description, Resources, Outputs, extra = {}) => ({
  AWSTemplateFormatVersion: '2010-09-09',
  Description: description,
  ...extra,
  Resources,
  Outputs
});
mkdirSync('infra/generated', { recursive: true });
const save = (name, template) =>
  writeFileSync(`infra/generated/${name}.json`, JSON.stringify(template, null, 2) + '\n');
save(
  'assets',
  wrap(
    'Thingelstad.xyz deployment artifacts',
    { AssetsBucket: bucket() },
    { AssetsBucket: output(ref('AssetsBucket')) }
  )
);
save(
  'certificate',
  wrap(
    'Thingelstad.xyz HTTPS certificate - external DNS validation',
    {
      Certificate: {
        Type: 'AWS::CertificateManager::Certificate',
        Properties: {
          DomainName: 'thingelstad.xyz',
          SubjectAlternativeNames: ['www.thingelstad.xyz'],
          ValidationMethod: 'DNS',
          Tags: [{ Key: 'project', Value: 'thingelstad.xyz' }]
        }
      }
    },
    { CertificateArn: output(ref('Certificate')) }
  )
);
save(
  'site',
  wrap(
    'Thingelstad.xyz project map and AI guide',
    {
      SiteBucket: bucket(),
      Allowance: {
        Type: 'AWS::DynamoDB::Table',
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [{ AttributeName: 'day', AttributeType: 'S' }],
          KeySchema: [{ AttributeName: 'day', KeyType: 'HASH' }],
          TimeToLiveSpecification: { AttributeName: 'expiresAt', Enabled: true },
          SSESpecification: { SSEEnabled: true }
        }
      },
      GuideLogs: {
        Type: 'AWS::Logs::LogGroup',
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
        Properties: { LogGroupName: sub('/aws/lambda/${AWS::StackName}-guide'), RetentionInDays: 14 }
      },
      GuideRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [{ Effect: 'Allow', Principal: { Service: 'lambda.amazonaws.com' }, Action: 'sts:AssumeRole' }]
          },
          Policies: [
            {
              PolicyName: 'GuideRuntime',
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                    Resource: get('GuideLogs', 'Arn')
                  },
                  { Effect: 'Allow', Action: 'dynamodb:UpdateItem', Resource: get('Allowance', 'Arn') },
                  {
                    Effect: 'Allow',
                    Action: 'bedrock:InvokeModelWithResponseStream',
                    Resource: [
                      sub(
                        'arn:${AWS::Partition}:bedrock:us-east-1:${AWS::AccountId}:inference-profile/us.anthropic.claude-haiku-4-5-20251001-v1:0'
                      ),
                      ...['us-east-1', 'us-east-2', 'us-west-2'].map((region) =>
                        sub(
                          `arn:\${AWS::Partition}:bedrock:${region}::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0`
                        )
                      )
                    ]
                  }
                ]
              }
            }
          ]
        }
      },
      Guide: {
        Type: 'AWS::Lambda::Function',
        DependsOn: 'GuideLogs',
        Properties: {
          FunctionName: sub('${AWS::StackName}-guide'),
          Runtime: 'nodejs24.x',
          Architectures: ['arm64'],
          Handler: 'index.handler',
          Role: get('GuideRole', 'Arn'),
          MemorySize: 512,
          Timeout: 28,
          ReservedConcurrentExecutions: 2,
          Code: { S3Bucket: ref('AssetsBucket'), S3Key: ref('GuideCodeKey') },
          Environment: {
            Variables: {
              GUIDE_ROLE_NAME: ref('GuideRole'),
              ALLOWANCE_TABLE: ref('Allowance'),
              GUIDE_DAILY_LIMIT: '100',
              ALLOWED_ORIGINS: sub(
                'https://thingelstad.xyz,https://www.thingelstad.xyz,https://${Distribution.DomainName}'
              )
            }
          }
        }
      },
      Api: { Type: 'AWS::ApiGatewayV2::Api', Properties: { Name: sub('${AWS::StackName}-api'), ProtocolType: 'HTTP' } },
      Integration: {
        Type: 'AWS::ApiGatewayV2::Integration',
        Properties: {
          ApiId: ref('Api'),
          IntegrationType: 'AWS_PROXY',
          IntegrationUri: get('Guide', 'Arn'),
          PayloadFormatVersion: '2.0',
          TimeoutInMillis: 29000
        }
      },
      ExploreRoute: {
        Type: 'AWS::ApiGatewayV2::Route',
        Properties: { ApiId: ref('Api'), RouteKey: 'POST /api/explore', Target: sub('integrations/${Integration}') }
      },
      HealthRoute: {
        Type: 'AWS::ApiGatewayV2::Route',
        Properties: { ApiId: ref('Api'), RouteKey: 'GET /api/health', Target: sub('integrations/${Integration}') }
      },
      Stage: {
        Type: 'AWS::ApiGatewayV2::Stage',
        DependsOn: ['ExploreRoute', 'HealthRoute'],
        Properties: {
          ApiId: ref('Api'),
          StageName: '$default',
          AutoDeploy: true,
          DefaultRouteSettings: { ThrottlingBurstLimit: 4, ThrottlingRateLimit: 1 }
        }
      },
      ApiPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          Action: 'lambda:InvokeFunction',
          FunctionName: ref('Guide'),
          Principal: 'apigateway.amazonaws.com',
          SourceArn: sub('arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${Api}/*/*/api/*')
        }
      },
      OriginAccess: {
        Type: 'AWS::CloudFront::OriginAccessControl',
        Properties: {
          OriginAccessControlConfig: {
            Name: sub('${AWS::StackName}-s3'),
            OriginAccessControlOriginType: 's3',
            SigningBehavior: 'always',
            SigningProtocol: 'sigv4'
          }
        }
      },
      Headers: {
        Type: 'AWS::CloudFront::ResponseHeadersPolicy',
        Properties: {
          ResponseHeadersPolicyConfig: {
            Name: sub('${AWS::StackName}-headers'),
            SecurityHeadersConfig: {
              ContentTypeOptions: { Override: true },
              FrameOptions: { FrameOption: 'DENY', Override: true },
              ReferrerPolicy: { ReferrerPolicy: 'strict-origin-when-cross-origin', Override: true },
              StrictTransportSecurity: { AccessControlMaxAgeSec: 31536000, Override: true }
            }
          }
        }
      },
      Distribution: {
        Type: 'AWS::CloudFront::Distribution',
        Properties: {
          DistributionConfig: {
            Enabled: true,
            Comment: 'Thingelstad.xyz - Things I have built',
            PriceClass: 'PriceClass_100',
            IPV6Enabled: true,
            HttpVersion: 'http2and3',
            DefaultRootObject: 'index.html',
            Aliases: yes(['thingelstad.xyz', 'www.thingelstad.xyz'], ref('AWS::NoValue')),
            ViewerCertificate: yes(
              {
                AcmCertificateArn: ref('CertificateArn'),
                SslSupportMethod: 'sni-only',
                MinimumProtocolVersion: 'TLSv1.2_2021'
              },
              { CloudFrontDefaultCertificate: true }
            ),
            Origins: [
              {
                Id: 'site',
                DomainName: get('SiteBucket', 'RegionalDomainName'),
                OriginAccessControlId: ref('OriginAccess'),
                S3OriginConfig: { OriginAccessIdentity: '' }
              },
              {
                Id: 'api',
                DomainName: sub('${Api}.execute-api.${AWS::Region}.amazonaws.com'),
                CustomOriginConfig: {
                  OriginProtocolPolicy: 'https-only',
                  OriginSSLProtocols: ['TLSv1.2'],
                  OriginReadTimeout: 30
                }
              }
            ],
            DefaultCacheBehavior: {
              TargetOriginId: 'site',
              ViewerProtocolPolicy: 'redirect-to-https',
              AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
              CachedMethods: ['GET', 'HEAD'],
              Compress: true,
              CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
              ResponseHeadersPolicyId: ref('Headers')
            },
            CacheBehaviors: [
              {
                PathPattern: '/api/*',
                TargetOriginId: 'api',
                ViewerProtocolPolicy: 'https-only',
                AllowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
                CachedMethods: ['GET', 'HEAD'],
                Compress: true,
                CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',
                OriginRequestPolicyId: 'b689b0a8-53d0-40ab-baf2-68738e2966ac',
                ResponseHeadersPolicyId: ref('Headers')
              }
            ]
          }
        }
      },
      SitePolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          Bucket: ref('SiteBucket'),
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { Service: 'cloudfront.amazonaws.com' },
                Action: 's3:GetObject',
                Resource: sub('${SiteBucket.Arn}/*'),
                Condition: {
                  StringEquals: {
                    'AWS:SourceArn': sub(
                      'arn:${AWS::Partition}:cloudfront::${AWS::AccountId}:distribution/${Distribution}'
                    )
                  }
                }
              }
            ]
          }
        }
      }
    },
    {
      SiteBucket: output(ref('SiteBucket')),
      DistributionId: output(ref('Distribution')),
      CloudFrontDomain: output(get('Distribution', 'DomainName')),
      GuideRoleArn: output(get('GuideRole', 'Arn')),
      ApiUrl: output(get('Api', 'ApiEndpoint'))
    },
    {
      Parameters: {
        AssetsBucket: { Type: 'String' },
        GuideCodeKey: { Type: 'String' },
        CertificateArn: { Type: 'String', Default: '' }
      },
      Conditions: { CustomDomain: { 'Fn::Not': [{ 'Fn::Equals': [ref('CertificateArn'), ''] }] } }
    }
  )
);

// Application delivery only. Infrastructure changes remain a separate deployment.
save(
  'delivery',
  wrap(
    'Thingelstad.xyz GitHub application delivery',
    {
      DeploymentRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Federated: sub(
                    'arn:${AWS::Partition}:iam::${AWS::AccountId}:oidc-provider/token.actions.githubusercontent.com'
                  )
                },
                Action: 'sts:AssumeRoleWithWebIdentity',
                Condition: {
                  StringEquals: {
                    'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                    'token.actions.githubusercontent.com:sub':
                      'repo:jthingelstad@5351/thingelstad.xyz@1417506858:ref:refs/heads/main'
                  }
                }
              }
            ]
          },
          Policies: [
            {
              PolicyName: 'ApplicationDelivery',
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['s3:ListBucket', 's3:GetBucketLocation'],
                    Resource: [
                      sub('arn:${AWS::Partition}:s3:::${SiteBucket}'),
                      sub('arn:${AWS::Partition}:s3:::${AssetsBucket}')
                    ]
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:GetObject', 's3:PutObject'],
                    Resource: [
                      sub('arn:${AWS::Partition}:s3:::${SiteBucket}/*'),
                      sub('arn:${AWS::Partition}:s3:::${AssetsBucket}/guide/*')
                    ]
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'cloudfront:CreateInvalidation',
                      'cloudfront:GetInvalidation',
                      'cloudfront:GetDistribution'
                    ],
                    Resource: sub('arn:${AWS::Partition}:cloudfront::${AWS::AccountId}:distribution/${DistributionId}')
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'cloudformation:DescribeStacks',
                      'cloudformation:GetTemplate',
                      'cloudformation:CreateChangeSet',
                      'cloudformation:DescribeChangeSet',
                      'cloudformation:ExecuteChangeSet',
                      'cloudformation:DeleteChangeSet',
                      'cloudformation:DescribeEvents',
                      'cloudformation:ListChangeSets'
                    ],
                    Resource: [
                      sub(
                        'arn:${AWS::Partition}:cloudformation:${AWS::Region}:${AWS::AccountId}:stack/thingelstad-xyz-site/*'
                      ),
                      sub('arn:${AWS::Partition}:cloudformation:${AWS::Region}:${AWS::AccountId}:changeSet/github-*/*')
                    ]
                  },
                  {
                    Effect: 'Allow',
                    Action: ['lambda:GetFunction', 'lambda:GetFunctionConfiguration', 'lambda:UpdateFunctionCode'],
                    Resource: sub(
                      'arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:function:thingelstad-xyz-site-guide'
                    )
                  }
                ]
              }
            }
          ]
        }
      }
    },
    { DeploymentRoleArn: output(get('DeploymentRole', 'Arn')) },
    {
      Parameters: {
        SiteBucket: { Type: 'String' },
        AssetsBucket: { Type: 'String' },
        DistributionId: { Type: 'String' }
      }
    }
  )
);
