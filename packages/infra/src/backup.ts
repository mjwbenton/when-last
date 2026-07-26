import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as path from 'node:path';
import { deployProvider } from './providers';
import { DOMAIN } from './site';

export function buildBackup() {
  const bucket = new aws.s3.BucketV2(
    'backup-bucket',
    { bucket: `${DOMAIN}-backups`, forceDestroy: false },
    { provider: deployProvider },
  );

  new aws.s3.BucketVersioningV2(
    'backup-bucket-versioning',
    { bucket: bucket.id, versioningConfiguration: { status: 'Enabled' } },
    { provider: deployProvider },
  );

  new aws.s3.BucketServerSideEncryptionConfigurationV2(
    'backup-bucket-sse',
    {
      bucket: bucket.id,
      rules: [{ applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' } }],
    },
    { provider: deployProvider },
  );

  new aws.s3.BucketPublicAccessBlock(
    'backup-bucket-public-access',
    {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    { provider: deployProvider },
  );

  const allowedOrigins = [`https://${DOMAIN}`, 'http://localhost:5173'];
  new aws.s3.BucketCorsConfigurationV2(
    'backup-bucket-cors',
    {
      bucket: bucket.id,
      corsRules: [
        {
          allowedMethods: ['GET', 'PUT'],
          allowedOrigins,
          allowedHeaders: ['*'],
          exposeHeaders: ['ETag'],
          maxAgeSeconds: 3000,
        },
      ],
    },
    { provider: deployProvider },
  );

  // Lambda execution role.
  const lambdaRole = new aws.iam.Role(
    'backup-lambda-role',
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
    },
    { provider: deployProvider },
  );

  new aws.iam.RolePolicyAttachment(
    'backup-lambda-logs',
    {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    },
    { provider: deployProvider },
  );

  // Federation role — trusted by the Lambda role, holds the bucket-wide
  // permissions. Lambda narrows these per request via a session policy
  // that scopes to exactly one key.
  const federationRole = new aws.iam.Role(
    'backup-federation-role',
    {
      assumeRolePolicy: pulumi.all([lambdaRole.arn]).apply(([lambdaRoleArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: lambdaRoleArn },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
      ),
    },
    { provider: deployProvider },
  );

  new aws.iam.RolePolicy(
    'backup-federation-s3',
    {
      role: federationRole.id,
      policy: bucket.arn.apply((arn) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:PutObject', 's3:GetObject'],
              Resource: `${arn}/*`,
            },
          ],
        }),
      ),
    },
    { provider: deployProvider },
  );

  new aws.iam.RolePolicy(
    'backup-lambda-assume-federation',
    {
      role: lambdaRole.id,
      policy: federationRole.arn.apply((arn) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [{ Effect: 'Allow', Action: 'sts:AssumeRole', Resource: arn }],
        }),
      ),
    },
    { provider: deployProvider },
  );

  const lambdaCodePath = path.resolve(__dirname, '..', 'lambda', 'dist');

  const lambdaFn = new aws.lambda.Function(
    'backup-api',
    {
      runtime: 'nodejs24.x',
      handler: 'handler.handler',
      role: lambdaRole.arn,
      code: new pulumi.asset.FileArchive(lambdaCodePath),
      timeout: 10,
      memorySize: 256,
      environment: {
        variables: {
          BACKUP_BUCKET: bucket.bucket,
          FEDERATION_ROLE_ARN: federationRole.arn,
          ALLOWED_ORIGINS: allowedOrigins.join(','),
        },
      },
    },
    { provider: deployProvider },
  );

  const fnUrl = new aws.lambda.FunctionUrl(
    'backup-api-url',
    {
      functionName: lambdaFn.name,
      authorizationType: 'NONE',
    },
    { provider: deployProvider },
  );

  return { bucket, lambdaFn, fnUrl };
}
