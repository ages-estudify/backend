import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { S3Service } from './s3.service';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class QuestionMediaService {
  constructor(private readonly s3: S3Service) {}

  buildMediaKey(questionId: string, extension: string): string {
    return `questions/${questionId}/${randomUUID()}.${extension}`;
  }

  async uploadQuestionImage(
    questionId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const extension = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
    if (!extension) {
      throw new BadRequestException(
        'Invalid image type. Allowed: image/jpeg, image/png, image/webp, image/gif',
      );
    }

    const mediaKey = this.buildMediaKey(questionId, extension);
    await this.s3.uploadObject(mediaKey, buffer, mimeType);
    return mediaKey;
  }

  async resolveSignedUrl(mediaKey: string | null | undefined): Promise<string | null> {
    if (!mediaKey) return null;

    if (mediaKey.startsWith('http://') || mediaKey.startsWith('https://')) {
      return mediaKey;
    }

    return this.s3.getSignedGetUrl(mediaKey);
  }

  async resolveSignedUrls(
    mediaKeys: (string | null | undefined)[],
  ): Promise<(string | null)[]> {
    return Promise.all(mediaKeys.map((key) => this.resolveSignedUrl(key)));
  }
}
