// NOTE: Requires @aws-sdk/client-s3 — add to package.json:
// "@aws-sdk/client-s3": "^3.x.x"
//
// S3 lifecycle rule recommendation (set manually in AWS console or IaC):
//   - Prefix: backups/
//   - Transition to S3-IA after 30 days
//   - Expire after 2557 days (7 years, per Australian AML/CTF record retention)

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('S3_CLIENT');

// Required env vars:
//   AWS_S3_BACKUP_BUCKET   — e.g. "anb-db-backups"
//   AWS_S3_BACKUP_REGION   — default ap-southeast-2
//   AWS_ACCESS_KEY_ID      — shared with SES/SNS
//   AWS_SECRET_ACCESS_KEY  — shared with SES/SNS

function getS3Client(): S3Client {
  return new S3Client({
    region: process.env.AWS_S3_BACKUP_REGION || 'ap-southeast-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

export interface UploadResult {
  key: string;
  sizeBytes: number;
  bucket: string;
}

export async function uploadBackupToS3(
  key: string,
  data: string,
): Promise<UploadResult> {
  const bucket = process.env.AWS_S3_BACKUP_BUCKET;
  if (!bucket) {
    throw new Error('AWS_S3_BACKUP_BUCKET environment variable is not set');
  }

  const body = Buffer.from(data, 'utf-8');
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'application/json',
    // Server-side encryption using AWS managed keys
    ServerSideEncryption: 'AES256',
    Metadata: {
      'created-at': new Date().toISOString(),
      'content-description': 'Supabase table backup — Australian National Bullion',
    },
  });

  await client.send(command);

  logger.log(`Uploaded ${key} (${body.byteLength} bytes) to s3://${bucket}`);

  return { key, sizeBytes: body.byteLength, bucket };
}
