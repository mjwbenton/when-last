import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { deployProvider, deployUsEast1Provider } from './providers';

export const DOMAIN = 'whenlast.mattb.tech';

export function buildSite() {
  const siteBucket = new aws.s3.BucketV2(
    'site-bucket',
    { bucket: DOMAIN },
    { provider: deployProvider },
  );

  new aws.s3.BucketPublicAccessBlock(
    'site-bucket-public-access',
    {
      bucket: siteBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    { provider: deployProvider },
  );

  const oac = new aws.cloudfront.OriginAccessControl(
    'site-oac',
    {
      name: `${DOMAIN}-oac`,
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
    },
    { provider: deployProvider },
  );

  const zone = new aws.route53.Zone(
    'site-zone',
    { name: DOMAIN, comment: 'When Last app subzone delegated from mattb.tech' },
    { provider: deployProvider },
  );

  const cert = new aws.acm.Certificate(
    'site-cert',
    { domainName: DOMAIN, validationMethod: 'DNS' },
    { provider: deployUsEast1Provider },
  );

  const validationRecord = cert.domainValidationOptions.apply((opts) => {
    const o = opts[0]!;
    return new aws.route53.Record(
      'site-cert-validation',
      {
        zoneId: zone.zoneId,
        name: o.resourceRecordName,
        type: o.resourceRecordType,
        records: [o.resourceRecordValue],
        ttl: 300,
      },
      { provider: deployProvider },
    );
  });

  const certValidation = new aws.acm.CertificateValidation(
    'site-cert-valid',
    {
      certificateArn: cert.arn,
      validationRecordFqdns: [validationRecord.fqdn],
    },
    { provider: deployUsEast1Provider },
  );

  const distribution = new aws.cloudfront.Distribution(
    'site-cdn',
    {
      enabled: true,
      isIpv6Enabled: true,
      defaultRootObject: 'index.html',
      aliases: [DOMAIN],
      priceClass: 'PriceClass_100',
      httpVersion: 'http2and3',
      origins: [
        {
          originId: 's3-site',
          domainName: siteBucket.bucketRegionalDomainName,
          originAccessControlId: oac.id,
          s3OriginConfig: { originAccessIdentity: '' },
        },
      ],
      defaultCacheBehavior: {
        targetOriginId: 's3-site',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        // AWS-managed CachingOptimized
        cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
      },
      // SPA routing: serve index.html for 403 (OAC denial on missing object) and 404.
      customErrorResponses: [
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: '/index.html',
          errorCachingMinTtl: 0,
        },
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html',
          errorCachingMinTtl: 0,
        },
      ],
      restrictions: { geoRestriction: { restrictionType: 'none' } },
      viewerCertificate: {
        acmCertificateArn: certValidation.certificateArn,
        sslSupportMethod: 'sni-only',
        minimumProtocolVersion: 'TLSv1.2_2021',
      },
    },
    { provider: deployProvider },
  );

  // Bucket policy: allow the distribution to read via OAC.
  new aws.s3.BucketPolicy(
    'site-bucket-policy',
    {
      bucket: siteBucket.id,
      policy: pulumi.all([siteBucket.arn, distribution.arn]).apply(([bucketArn, distArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowCloudFrontServicePrincipalReadOnly',
              Effect: 'Allow',
              Principal: { Service: 'cloudfront.amazonaws.com' },
              Action: 's3:GetObject',
              Resource: `${bucketArn}/*`,
              Condition: {
                StringEquals: { 'AWS:SourceArn': distArn },
              },
            },
          ],
        }),
      ),
    },
    { provider: deployProvider },
  );

  // Apex A/AAAA → CloudFront
  new aws.route53.Record(
    'site-apex-a',
    {
      zoneId: zone.zoneId,
      name: DOMAIN,
      type: 'A',
      aliases: [
        {
          name: distribution.domainName,
          zoneId: distribution.hostedZoneId,
          evaluateTargetHealth: false,
        },
      ],
    },
    { provider: deployProvider },
  );
  new aws.route53.Record(
    'site-apex-aaaa',
    {
      zoneId: zone.zoneId,
      name: DOMAIN,
      type: 'AAAA',
      aliases: [
        {
          name: distribution.domainName,
          zoneId: distribution.hostedZoneId,
          evaluateTargetHealth: false,
        },
      ],
    },
    { provider: deployProvider },
  );

  return {
    siteBucket,
    distribution,
    zone,
  };
}
