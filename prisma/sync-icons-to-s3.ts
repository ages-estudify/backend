import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import type { PrismaClient } from '@prisma/client';

function isLegacyLocalIconPath(value: string): boolean {
  return value.startsWith('/');
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

function extensionFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? 'png';
  return ext === 'jpeg' ? 'jpg' : ext;
}

function mimeTypeFromExtension(extension: string): string {
  return MIME_BY_EXTENSION[extension] ?? 'image/png';
}

function createS3Client(): S3Client | null {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;
  if (!region || !bucket) {
    console.warn('Skipping S3 icon sync: AWS_REGION or AWS_S3_BUCKET not set');
    return null;
  }

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  return new S3Client({
    region,
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
  });
}

async function uploadPathIcon(
  client: S3Client,
  bucket: string,
  pathId: string,
  localIconPath: string,
  publicDir: string,
): Promise<string | null> {
  const filePath = join(publicDir, localIconPath);
  if (!existsSync(filePath)) {
    console.warn(`Missing icon file for path/${pathId}: ${filePath}`);
    return null;
  }

  const extension = extensionFromPath(localIconPath);
  const mimeType = mimeTypeFromExtension(extension);
  const key = `paths/${pathId}/${randomUUID()}.${extension}`;
  const buffer = readFileSync(filePath);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }),
  );

  return key;
}

export async function syncIconsToS3(prisma: PrismaClient): Promise<void> {
  const client = createS3Client();
  const bucket = process.env.AWS_S3_BUCKET;
  if (!client || !bucket) {
    return;
  }

  const publicDir = join(__dirname, '..', 'public');
  let uploaded = 0;

  const paths = await prisma.path.findMany();
  for (const path of paths) {
    if (!isLegacyLocalIconPath(path.icon_key)) continue;

    const key = await uploadPathIcon(client, bucket, path.id, path.icon_key, publicDir);
    if (!key) continue;

    await prisma.path.update({
      where: { id: path.id },
      data: { icon_key: key },
    });
    uploaded++;
  }

  console.log(`Synced ${uploaded} path icon(s) to S3`);
}
