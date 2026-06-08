import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { S3Service } from '../storage/s3.service';
import { decodeBase64Image } from '../storage/base64-image.util';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Injectable()
export class ProfilePictureService {
  constructor(private readonly s3: S3Service) {}

  buildProfilePictureKey(userId: string, extension: string): string {
    return `profile-pictures/${userId}/${randomUUID()}.${extension}`;
  }

  async upload(userId: string, imageBase64: string): Promise<string> {
    const { buffer, mimeType } = decodeBase64Image(imageBase64);

    const extension = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
    if (!extension) {
      throw new BadRequestException('Tipo de imagem inválido. Formatos aceitos: jpeg, png, heic');
    }

    if (buffer.length > MAX_SIZE_BYTES) {
      throw new BadRequestException('Imagem muito grande. Tamanho máximo: 5MB');
    }

    const key = this.buildProfilePictureKey(userId, extension);
    await this.s3.uploadObject(key, buffer, mimeType);
    return key;
  }

  async resolveSignedUrl(key: string | null | undefined): Promise<string | null> {
    if (!key) return null;
    return this.s3.getSignedGetUrl(key);
  }
}
