import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProfilePictureService } from './profile-picture.service';
import { S3Service } from '../storage/s3.service';

const mockS3Service = {
  uploadObject: jest.fn(),
  getSignedGetUrl: jest.fn(),
};

describe('ProfilePictureService', () => {
  let service: ProfilePictureService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfilePictureService, { provide: S3Service, useValue: mockS3Service }],
    }).compile();

    service = module.get<ProfilePictureService>(ProfilePictureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload()', () => {
    const validPngBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    it('should upload a valid png and return the key', async () => {
      mockS3Service.uploadObject.mockResolvedValue(undefined);

      const key = await service.upload('user-id', validPngBase64);

      expect(mockS3Service.uploadObject).toHaveBeenCalledTimes(1);
      expect(key).toMatch(/^profile-pictures\/user-id\/.+\.png$/);
    });

    it('should throw BadRequestException for invalid mime type', async () => {
      const gifBase64 =
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

      await expect(service.upload('user-id', gifBase64)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockS3Service.uploadObject).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty image', async () => {
      await expect(service.upload('user-id', '')).rejects.toBeInstanceOf(BadRequestException);
      expect(mockS3Service.uploadObject).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when image exceeds 5MB', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 0xff);
      const largeBase64 = `data:image/png;base64,${largeBuffer.toString('base64')}`;

      await expect(service.upload('user-id', largeBase64)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockS3Service.uploadObject).not.toHaveBeenCalled();
    });

    it('should accept jpeg images', async () => {
      mockS3Service.uploadObject.mockResolvedValue(undefined);
      const jpegBase64 =
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';

      const key = await service.upload('user-id', jpegBase64);

      expect(key).toMatch(/^profile-pictures\/user-id\/.+\.jpg$/);
    });
  });

  describe('resolveSignedUrl()', () => {
    it('should return null when key is null', async () => {
      const result = await service.resolveSignedUrl(null);
      expect(result).toBeNull();
      expect(mockS3Service.getSignedGetUrl).not.toHaveBeenCalled();
    });

    it('should return null when key is undefined', async () => {
      const result = await service.resolveSignedUrl(undefined);
      expect(result).toBeNull();
      expect(mockS3Service.getSignedGetUrl).not.toHaveBeenCalled();
    });

    it('should return signed url when key exists', async () => {
      mockS3Service.getSignedGetUrl.mockResolvedValue('https://signed-url.com/photo.png');

      const result = await service.resolveSignedUrl('profile-pictures/user-id/photo.png');

      expect(result).toBe('https://signed-url.com/photo.png');
      expect(mockS3Service.getSignedGetUrl).toHaveBeenCalledWith(
        'profile-pictures/user-id/photo.png',
      );
    });
  });

  describe('buildProfilePictureKey()', () => {
    it('should build key with correct format', () => {
      const key = service.buildProfilePictureKey('user-123', 'png');
      expect(key).toMatch(/^profile-pictures\/user-123\/.+\.png$/);
    });

    it('should generate unique keys for same user', () => {
      const key1 = service.buildProfilePictureKey('user-123', 'png');
      const key2 = service.buildProfilePictureKey('user-123', 'png');
      expect(key1).not.toBe(key2);
    });
  });
});
