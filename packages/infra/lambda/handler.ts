import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';

type FunctionUrlEvent = {
  version?: string;
  requestContext?: { http?: { method?: string } };
  headers?: Record<string, string | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
};

type FunctionUrlResult = {
  statusCode: number;
  headers: Record<string, string>;
  body?: string;
};

const REGION = process.env.AWS_REGION ?? 'us-east-1';
const BUCKET = required('BACKUP_BUCKET');
const FEDERATION_ROLE_ARN = required('FEDERATION_ROLE_ARN');
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const KEY_PATTERN = /^wl-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/;

const sts = new STSClient({ region: REGION });

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing env var ${name}`);
  return v;
}

function corsHeaders(origin: string | undefined): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : (ALLOWED_ORIGINS[0] ?? ''),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '3000',
    Vary: 'Origin',
  };
}

function reply(status: number, body: unknown, origin: string | undefined): FunctionUrlResult {
  return {
    statusCode: status,
    headers: { ...corsHeaders(origin), 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export const handler = async (event: FunctionUrlEvent): Promise<FunctionUrlResult> => {
  const origin = event.headers?.origin ?? event.headers?.Origin;
  const method = event.requestContext?.http?.method ?? 'POST';

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(origin) };
  }
  if (method !== 'POST') {
    return reply(405, { error: 'method not allowed' }, origin);
  }

  let body: { key?: unknown; action?: unknown };
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return reply(400, { error: 'invalid json' }, origin);
  }

  const { key, action } = body;
  if (typeof key !== 'string' || !KEY_PATTERN.test(key)) {
    return reply(400, { error: 'invalid key' }, origin);
  }
  if (action !== 'put' && action !== 'get') {
    return reply(400, { error: 'invalid action' }, origin);
  }

  const objectKey = `${key}/state.json`;
  const sessionPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: action === 'put' ? ['s3:PutObject'] : ['s3:GetObject'],
        Resource: `arn:aws:s3:::${BUCKET}/${objectKey}`,
      },
    ],
  };

  const res = await sts.send(
    new AssumeRoleCommand({
      RoleArn: FEDERATION_ROLE_ARN,
      RoleSessionName: `wl-${action}-${key.replace(/[^a-z0-9]/gi, '')}`.slice(0, 64),
      DurationSeconds: 900,
      Policy: JSON.stringify(sessionPolicy),
    }),
  );
  const c = res.Credentials;
  if (!c?.AccessKeyId || !c.SecretAccessKey || !c.SessionToken || !c.Expiration) {
    return reply(500, { error: 'sts missing credentials' }, origin);
  }
  return reply(
    200,
    {
      credentials: {
        accessKeyId: c.AccessKeyId,
        secretAccessKey: c.SecretAccessKey,
        sessionToken: c.SessionToken,
        expiration: c.Expiration.toISOString(),
      },
      bucket: BUCKET,
      region: REGION,
      objectKey,
    },
    origin,
  );
};
