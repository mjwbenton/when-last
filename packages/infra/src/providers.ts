import * as aws from '@pulumi/aws';

// Deploy account 027053845179 owns the app: S3 site bucket, CloudFront,
// Route53 zone for whenlast.mattb.tech, Lambda + backup bucket.
//
// Parent account 858777967843 owns the mattb.tech public hosted zone
// (Z2GPSB1CDK86DH) and holds the GitHub OIDC role github-actions-admin.
// That role has AdministratorAccess in the parent account and is trusted
// to assume arn:aws:iam::027053845179:role/admin in the deploy account
// (provisioned by mjwbenton/aws-account-stack).
//
// `pulumi up` must therefore run with ambient credentials in the parent
// account: `parentZoneProvider` uses them directly for the Route53
// delegation, and `deployProvider` STS-AssumeRoles into the deploy
// account's `admin` role for everything else.

export const deployProvider = new aws.Provider('deploy', {
  region: 'us-east-1',
  allowedAccountIds: ['027053845179'],
  assumeRoles: [
    {
      roleArn: 'arn:aws:iam::027053845179:role/admin',
      sessionName: 'pulumi-deploy',
    },
  ],
});

export const parentZoneProvider = new aws.Provider('parent-zone', {
  region: 'us-east-1',
  allowedAccountIds: ['858777967843'],
});

// ACM certs for CloudFront must live in us-east-1 even if the rest of
// the deploy resources are regional — kept as a separate provider for
// clarity.
export const deployUsEast1Provider = deployProvider;
