import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { parentZoneProvider } from './providers';
import { DOMAIN } from './site';

const PARENT_ZONE_ID = 'Z2GPSB1CDK86DH'; // mattb.tech public hosted zone (account 858777967843)

export function delegateSubzone(nameServers: pulumi.Output<string[]>) {
  return new aws.route53.Record(
    'delegation-ns',
    {
      zoneId: PARENT_ZONE_ID,
      name: DOMAIN,
      type: 'NS',
      ttl: 300,
      records: nameServers,
    },
    { provider: parentZoneProvider },
  );
}
