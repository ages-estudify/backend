import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { isLegacyLocalIconPath, toAbsoluteAssetUrl } from './asset-url.util';
import { S3Service } from './s3.service';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class IconMediaService {
  constructor(private readonly s3: S3Service) {}

  buildPathIconKey(pathId: string, extension: string): string {
    return `paths/${pathId}/${randomUUID()}.${extension}`;
  }

  async uploadPathIcon(pathId: string, buffer: Buffer, mimeType: string): Promise<string> {
    const extension = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
    if (!extension) {
      throw new BadRequestException(
        'Invalid image type. Allowed: image/jpeg, image/png, image/webp, image/gif',
      );
    }

    const mediaKey = this.buildPathIconKey(pathId, extension);
    await this.s3.uploadObject(mediaKey, buffer, mimeType);
    return mediaKey;
  }

  async resolveIconUrl(iconRef: string | null | undefined): Promise<string | null> {
    if (!iconRef) return null;

    if (iconRef.startsWith('http://') || iconRef.startsWith('https://')) {
      return iconRef;
    }

    if (isLegacyLocalIconPath(iconRef)) {
      return toAbsoluteAssetUrl(iconRef);
    }

    return this.s3.getSignedGetUrl(iconRef);
  }

  async resolveIconUrls(iconRefs: (string | null | undefined)[]): Promise<(string | null)[]> {
    return Promise.all(iconRefs.map((ref) => this.resolveIconUrl(ref)));
  }
}
