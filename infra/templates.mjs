import { writeFileSync, mkdirSync } from 'node:fs';
import { viewerRequestCode } from './viewer-request.mjs';
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
    'Thingelstad.xyz static site',
    {
      SiteBucket: bucket(),
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
      // Directory indexes, the slash form, and www to the apex. The code and its rules are in viewer-request.mjs.
      DirectoryIndex: {
        Type: 'AWS::CloudFront::Function',
        Properties: {
          Name: sub('${AWS::StackName}-directory-index'),
          AutoPublish: true,
          FunctionConfig: {
            Comment: 'Serve index.html for directory URLs and redirect www to the apex',
            Runtime: 'cloudfront-js-2.0'
          },
          FunctionCode: viewerRequestCode
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
      CloudFrontDomain: output(get('Distribution', 'DomainName'))
    },
    {
      Parameters: {
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
                    Resource: sub('arn:${AWS::Partition}:s3:::${SiteBucket}')
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:GetObject', 's3:PutObject'],
                    Resource: sub('arn:${AWS::Partition}:s3:::${SiteBucket}/*')
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
                    // Read-only: the deploy refuses to publish unless the live template matches the generated one.
                    Effect: 'Allow',
                    Action: ['cloudformation:DescribeStacks', 'cloudformation:GetTemplate'],
                    Resource: sub(
                      'arn:${AWS::Partition}:cloudformation:${AWS::Region}:${AWS::AccountId}:stack/thingelstad-xyz-site/*'
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
        DistributionId: { Type: 'String' }
      }
    }
  )
);
