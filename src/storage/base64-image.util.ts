import { BadRequestException } from '@nestjs/common';

const DATA_URI_PATTERN = /^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/i;

const MIME_BY_FORMAT: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

export type DecodedBase64Image = {
  buffer: Buffer;
  mimeType: string;
};

export function decodeBase64Image(input: string): DecodedBase64Image {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new BadRequestException('Image is empty');
  }

  const dataUri = DATA_URI_PATTERN.exec(trimmed);
  if (dataUri) {
    const format = dataUri[1].toLowerCase();
    const mimeType = MIME_BY_FORMAT[format];
    const buffer = Buffer.from(dataUri[2], 'base64');
    if (!buffer.length) {
      throw new BadRequestException('Invalid base64 image data');
    }
    return { buffer, mimeType };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(trimmed, 'base64');
  } catch {
    throw new BadRequestException('Invalid base64 image');
  }

  if (!buffer.length) {
    throw new BadRequestException('Invalid base64 image');
  }

  return { buffer, mimeType: sniffImageMimeType(buffer) };
}

function sniffImageMimeType(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (buffer.length >= 6 && buffer.toString('ascii', 0, 6) === 'GIF87a') {
    return 'image/gif';
  }
  if (buffer.length >= 6 && buffer.toString('ascii', 0, 6) === 'GIF89a') {
    return 'image/gif';
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer[8] === 0x57) {
    return 'image/webp';
  }

  return 'image/png';
}
