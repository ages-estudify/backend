import { BadRequestException } from '@nestjs/common';
import { decodeBase64Image } from './base64-image.util';

const PNG_1X1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('decodeBase64Image', () => {
  it('decodes data URI png', () => {
    const { buffer, mimeType } = decodeBase64Image(`data:image/png;base64,${PNG_1X1}`);
    expect(mimeType).toBe('image/png');
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('decodes raw base64 and sniffs png', () => {
    const { buffer, mimeType } = decodeBase64Image(PNG_1X1);
    expect(mimeType).toBe('image/png');
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('throws on empty string', () => {
    expect(() => decodeBase64Image('')).toThrow(BadRequestException);
  });
});
