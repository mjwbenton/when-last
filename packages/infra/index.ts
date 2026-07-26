import { buildSite } from './src/site';
import { delegateSubzone } from './src/delegation';
import { buildBackup } from './src/backup';

const site = buildSite();
delegateSubzone(site.zone.nameServers);
const backup = buildBackup();

export const siteBucketName = site.siteBucket.bucket;
export const cloudfrontDistributionId = site.distribution.id;
export const cloudfrontDomain = site.distribution.domainName;
export const zoneNameServers = site.zone.nameServers;
export const backupBucketName = backup.bucket.bucket;
export const backupApiUrl = backup.fnUrl.functionUrl;
