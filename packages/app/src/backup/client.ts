import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import type { AppState } from '../state';
import { appStateSchema } from './schema';

type Creds = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: string;
};

type VendResponse = {
  credentials: Creds;
  bucket: string;
  region: string;
  objectKey: string;
};

function apiUrl(): string {
  const url = import.meta.env['VITE_BACKUP_API'];
  if (!url) throw new Error('VITE_BACKUP_API is not set');
  return url;
}

async function vendCredentials(key: string, action: 'put' | 'get'): Promise<VendResponse> {
  const res = await fetch(apiUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key, action }),
  });
  if (!res.ok) throw new Error(`backup api ${res.status}: ${await res.text()}`);
  return (await res.json()) as VendResponse;
}

function s3For(vend: VendResponse): S3Client {
  return new S3Client({
    region: vend.region,
    credentials: {
      accessKeyId: vend.credentials.accessKeyId,
      secretAccessKey: vend.credentials.secretAccessKey,
      sessionToken: vend.credentials.sessionToken,
    },
  });
}

export async function uploadSnapshot(state: AppState): Promise<void> {
  const vend = await vendCredentials(state.backupKey, 'put');
  const client = s3For(vend);
  const body = JSON.stringify(state);
  await client.send(
    new PutObjectCommand({
      Bucket: vend.bucket,
      Key: vend.objectKey,
      Body: body,
      ContentType: 'application/json',
    }),
  );
}

export async function downloadSnapshot(key: string): Promise<AppState> {
  const vend = await vendCredentials(key, 'get');
  const client = s3For(vend);
  const res = await client.send(new GetObjectCommand({ Bucket: vend.bucket, Key: vend.objectKey }));
  const text = await res.Body?.transformToString('utf-8');
  if (!text) throw new Error('empty snapshot');
  const parsed = JSON.parse(text) as unknown;
  // zod's `.optional()` inserts `| undefined`, which conflicts with our
  // `exactOptionalPropertyTypes: true` declarations. The validated
  // shape is a valid AppState in practice.
  return appStateSchema.parse(parsed) as AppState;
}
