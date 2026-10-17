import { writeFileSync, mkdirSync } from 'node:fs';
const ref = (name) => ({ Ref: name });
const sub = (value) => ({ 'Fn::Sub': value });
const get = (name, field) => ({ 'Fn::GetAtt': [name, field] });
const yes = (a, b) => ({ 'Fn::If': ['CustomDomain', a, b] });
// The Thingelstad family alarm topic, subscribed to the shared projects-ops-alerts queue (as thingy-web's 5xx alarm is).
const alarmTopic = sub('arn:${AWS::Partition}:sns:us-east-1:${AWS::AccountId}:weekly-thing-librarian-alarms');
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
    {
      AssetsBucket: bucket(),
      AssetsPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          Bucket: ref('AssetsBucket'),
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { Service: 'lambda.amazonaws.com' },
                Action: ['s3:GetObject', 's3:GetObjectVersion'],
                Resource: sub('${AssetsBucket.Arn}/guide/*'),
                Condition: {
                  StringEquals: { 'AWS:SourceAccount': ref('AWS::AccountId') },
                  ArnLike: {
                    'AWS:SourceArn': sub(
                      'arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:web-function/thingelstad-xyz-site-guide-web/revision/*'
                    )
                  }
                }
              }
            ]
          }
        }
      }
    },
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
          ValidationMethod: 'DNS'
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
      // Web Functions write in-Region to `<group>.local` first; without this group and grant the guide logs nothing.
      GuideLocalLogs: {
        Type: 'AWS::Logs::LogGroup',
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
        Properties: { LogGroupName: sub('/aws/lambda/${AWS::StackName}-guide.local'), RetentionInDays: 14 }
      },
      // The guide answers 200 before model work, so a model failure is only visible in its error log.
      GuideFailureFilter: {
        Type: 'AWS::Logs::MetricFilter',
        Properties: {
          LogGroupName: ref('GuideLogs'),
          FilterPattern: '{ $.level = "ERROR" && $.message = "AI guide:*" && $.message != "AI guide: AbortError*" }',
          MetricTransformations: [
            { MetricNamespace: 'ThingelstadXyz', MetricName: 'GuideFailures', MetricValue: '1', Unit: 'Count' }
          ]
        }
      },
      GuideFailureAlarm: {
        Type: 'AWS::CloudWatch::Alarm',
        Properties: {
          AlarmName: sub('${AWS::StackName}-guide-failures'),
          AlarmDescription:
            'The AI guide logged a model or allowance failure. Client disconnects and the 24-second deadline are not counted.',
          Namespace: 'ThingelstadXyz',
          MetricName: 'GuideFailures',
          Statistic: 'Sum',
          Period: 300,
          EvaluationPeriods: 1,
          Threshold: 1,
          ComparisonOperator: 'GreaterThanOrEqualToThreshold',
          TreatMissingData: 'notBreaching',
          AlarmActions: [alarmTopic]
        }
      },
      DistributionErrorAlarm: {
        Type: 'AWS::CloudWatch::Alarm',
        Properties: {
          AlarmName: sub('${AWS::StackName}-distribution-5xx'),
          AlarmDescription:
            'CloudFront returned more than 5% 5xx responses for thingelstad.xyz in two of three five-minute windows.',
          Namespace: 'AWS/CloudFront',
          MetricName: '5xxErrorRate',
          Dimensions: [
            { Name: 'DistributionId', Value: ref('Distribution') },
            { Name: 'Region', Value: 'Global' }
          ],
          Statistic: 'Average',
          Period: 300,
          EvaluationPeriods: 3,
          DatapointsToAlarm: 2,
          Threshold: 5,
          ComparisonOperator: 'GreaterThanThreshold',
          TreatMissingData: 'notBreaching',
          AlarmActions: [alarmTopic]
        }
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
                    Resource: [get('GuideLogs', 'Arn'), get('GuideLocalLogs', 'Arn')]
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
      GuideWeb: {
        Type: 'AWS::Lambda::WebFunction',
        Properties: { FunctionName: sub('${AWS::StackName}-guide-web') }
      },
      GuideRevision: {
        Type: 'AWS::Lambda::WebFunctionRevision',
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
        Properties: {
          FunctionName: ref('GuideWeb'),
          BuildConfig: {
            CodeConfig: { S3Object: { Bucket: ref('AssetsBucket'), Key: ref('GuideCodeKey') } },
            RuntimeConfig: { Runtime: 'nodejs24.x' }
          },
          ServiceConfig: {
            ExecutionRoleArn: get('GuideRole', 'Arn'),
            TimeoutSeconds: 28,
            MaxConcurrencyPerEnvironment: 1,
            TelemetryConfig: { LoggingConfig: { LogGroup: ref('GuideLogs') } },
            EnvironmentVariables: {
              GUIDE_ROLE_NAME: ref('GuideRole'),
              ALLOWANCE_TABLE: ref('Allowance'),
              GUIDE_DAILY_LIMIT: '100',
              ALLOWED_ORIGINS: sub('https://thingelstad.xyz,https://www.thingelstad.xyz,https://${CloudFrontDomain}')
            }
          }
        }
      },
      GuideEndpoint: {
        Type: 'AWS::Lambda::WebFunctionEndpoint',
        Properties: {
          FunctionName: ref('GuideWeb'),
          EndpointName: 'prod',
          EndpointType: 'HomeRegion',
          AuthType: 'IamAuth',
          ScalingConfig: { MaxEnvironments: 2 },
          RevisionWeights: [{ RevisionId: get('GuideRevision', 'RevisionId'), Weight: 100 }]
        }
      },
      GuidePolicy: {
        Type: 'AWS::Lambda::ResourcePolicy',
        Properties: {
          ResourceArn: get('GuideWeb', 'FunctionArn'),
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { Service: 'cloudfront.amazonaws.com' },
                Action: 'lambda:InvokeWebFunctionEndpoint',
                Resource: sub('${GuideWeb.FunctionArn}/endpoint/prod'),
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
      },
      GuideOriginAccess: {
        Type: 'AWS::CloudFront::OriginAccessControl',
        Properties: {
          OriginAccessControlConfig: {
            Name: sub('${AWS::StackName}-guide-web'),
            OriginAccessControlOriginType: 'lambda',
            SigningBehavior: 'always-amz-auth',
            SigningProtocol: 'sigv4'
          }
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
      // The static site is a tree of directories, each with an index.html, and S3 behind OAC does not serve
      // directory indexes. This viewer-request function rewrites "/things/elixir/" to its index.html and
      // sends "/things/elixir" to the slash form. Paths with a dot are files and pass through untouched.
      DirectoryIndex: {
        Type: 'AWS::CloudFront::Function',
        Properties: {
          Name: sub('${AWS::StackName}-directory-index'),
          AutoPublish: true,
          FunctionConfig: { Comment: 'Serve index.html for directory URLs', Runtime: 'cloudfront-js-2.0' },
          FunctionCode: [
            'function handler(event) {',
            '  var request = event.request;',
            '  var uri = request.uri;',
            "  if (uri.endsWith('/')) {",
            "    request.uri = uri + 'index.html';",
            "  } else if (!uri.split('/').pop().includes('.')) {",
            '    return {',
            '      statusCode: 301,',
            "      statusDescription: 'Moved Permanently',",
            "      headers: { location: { value: uri + '/' } }",
            '    };',
            '  }',
            '  return request;',
            '}',
            ''
          ].join('\n')
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
                DomainName: ref('GuideOriginDomain'),
                OriginAccessControlId: ref('GuideOriginAccess'),
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
              ResponseHeadersPolicyId: ref('Headers'),
              FunctionAssociations: [{ EventType: 'viewer-request', FunctionARN: get('DirectoryIndex', 'FunctionARN') }]
            },
            // A missing object is a 403 from S3 behind OAC (no ListBucket). Both become the site's 404 page.
            CustomErrorResponses: [
              { ErrorCode: 403, ResponseCode: 404, ResponsePagePath: '/404.html', ErrorCachingMinTTL: 10 },
              { ErrorCode: 404, ResponseCode: 404, ResponsePagePath: '/404.html', ErrorCachingMinTTL: 10 }
            ],
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
      GuideEndpointDomain: output(get('GuideEndpoint', 'DomainName')),
      GuideEndpointArn: output(get('GuideEndpoint', 'EndpointArn')),
      GuideRevisionId: output(get('GuideRevision', 'RevisionId'))
    },
    {
      Parameters: {
        AssetsBucket: { Type: 'String' },
        GuideCodeKey: { Type: 'String', AllowedPattern: 'guide/[a-f0-9]{64}\\.zip' },
        GuideOriginDomain: {
          Type: 'String',
          AllowedPattern: '[a-z0-9-]+\\.[a-z0-9-]+\\.lambda-web\\.us-east-1\\.on\\.aws'
        },
        CloudFrontDomain: { Type: 'String', AllowedPattern: '[a-z0-9]+\\.cloudfront\\.net' },
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
        // The pinned cfn-lint IAM action list predates Web Functions; resource schemas and live change sets validate these actions.
        Metadata: { 'cfn-lint': { config: { ignore_checks: ['W3037'] } } },
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
                    // Live DescribeEvents requests currently reject scoped stack/change-set
                    // ARNs despite an allowed IAM simulation. Limit this read-only exception
                    // to the application region; the caller still supplies the exact stack ID.
                    Effect: 'Allow',
                    Action: 'cloudformation:DescribeEvents',
                    Resource: '*',
                    Condition: { StringEquals: { 'aws:RequestedRegion': ref('AWS::Region') } }
                  },
                  {
                    Effect: 'Allow',
                    Action: 'iam:GetRole',
                    Resource: ref('GuideRoleArn')
                  },
                  {
                    Effect: 'Allow',
                    Action: 'iam:PassRole',
                    Resource: ref('GuideRoleArn'),
                    Condition: { StringEquals: { 'iam:PassedToService': 'lambda.amazonaws.com' } }
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:GetObjectVersion'],
                    Resource: sub('arn:${AWS::Partition}:s3:::${AssetsBucket}/guide/*')
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'lambda:GetWebFunction',
                      'lambda:CreateWebFunctionRevision',
                      'lambda:GetWebFunctionRevision',
                      'lambda:ListTags'
                    ],
                    Resource: [
                      sub(
                        'arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:web-function/thingelstad-xyz-site-guide-web'
                      ),
                      sub(
                        'arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:web-function/thingelstad-xyz-site-guide-web/revision/*'
                      )
                    ]
                  },
                  {
                    Effect: 'Allow',
                    Action: ['lambda:GetWebFunctionEndpoint', 'lambda:UpdateWebFunctionEndpoint'],
                    Resource: sub(
                      'arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:web-function/thingelstad-xyz-site-guide-web/endpoint/prod'
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
        DistributionId: { Type: 'String' },
        GuideRoleArn: { Type: 'String' }
      }
    }
  )
);
