import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { IconMediaService } from '../storage/icon-media.service';
import { AdminTopicsRepository } from './admin-topics.repository';
import { AdminTopicsService } from './admin-topics.service';

type RepoMock = jest.Mocked<
  Pick<
    AdminTopicsRepository,
    | 'findMany'
    | 'findById'
    | 'create'
    | 'update'
    | 'softDelete'
    | 'subjectExists'
    | 'getMaxSchedulePosition'
  >
>;

const buildPath = (overrides: Record<string, unknown> = {}) => ({
  id: 'path-1',
  name: 'Álgebra Básica',
  text: 'Introdução',
  icon_key: 'paths/icon.png',
  schedule_position: 3,
  trail_position: 1,
  subject_id: 'subject-1',
  enable: true,
  ...overrides,
});

describe('AdminTopicsService', () => {
  let service: AdminTopicsService;
  let repository: RepoMock;
  let iconMedia: {
    resolveIconUrl: jest.Mock;
    resolveIconUrls: jest.Mock;
    uploadPathIconFromBase64: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      subjectExists: jest.fn(),
      getMaxSchedulePosition: jest.fn(),
    };
    iconMedia = {
      resolveIconUrl: jest.fn(),
      resolveIconUrls: jest.fn(),
      uploadPathIconFromBase64: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminTopicsService,
        { provide: AdminTopicsRepository, useValue: repository },
        { provide: IconMediaService, useValue: iconMedia },
      ],
    }).compile();

    service = module.get<AdminTopicsService>(AdminTopicsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns mapped enabled topics with resolved icon urls', async () => {
      repository.findMany.mockResolvedValue([buildPath()] as never);
      iconMedia.resolveIconUrls.mockResolvedValue(['https://cdn/icon.png']);

      const result = await service.findAll(true, 'subject-1');

      expect(repository.findMany).toHaveBeenCalledWith(true, 'subject-1');
      expect(result).toEqual({
        data: [
          {
            id: 'path-1',
            name: 'Álgebra Básica',
            text: 'Introdução',
            iconUrl: 'https://cdn/icon.png',
            order: 1,
            subjectId: 'subject-1',
          },
        ],
      });
    });

    it('forwards the enable and subjectId filters', async () => {
      repository.findMany.mockResolvedValue([] as never);
      iconMedia.resolveIconUrls.mockResolvedValue([]);

      await service.findAll(false, 'subject-9');

      expect(repository.findMany).toHaveBeenCalledWith(false, 'subject-9');
    });
  });

  describe('create', () => {
    it('creates a topic, auto-assigning schedule_position = max + 1', async () => {
      repository.subjectExists.mockResolvedValue(true);
      repository.getMaxSchedulePosition.mockResolvedValue(7);
      repository.create.mockResolvedValue(buildPath({ id: 'new-id' }) as never);

      const result = await service.create({
        name: 'Nova trilha',
        subjectId: 'subject-1',
        order: 2,
      });

      expect(result).toEqual({ id: 'new-id', message: 'Topic created successfully' });
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Nova trilha',
        text: '',
        icon_key: '',
        trail_position: 2,
        schedule_position: 8,
        subject: { connect: { id: 'subject-1' } },
      });
    });

    it('uses schedule_position = 1 when there are no paths yet and keeps provided text', async () => {
      repository.subjectExists.mockResolvedValue(true);
      repository.getMaxSchedulePosition.mockResolvedValue(null);
      repository.create.mockResolvedValue(buildPath() as never);

      await service.create({
        name: 'X',
        subjectId: 'subject-1',
        order: 1,
        text: 'corpo',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ schedule_position: 1, text: 'corpo', icon_key: '' }),
      );
      expect(iconMedia.uploadPathIconFromBase64).not.toHaveBeenCalled();
    });

    it('uploads the icon to S3 and stores the returned key when a base64 image is provided', async () => {
      repository.subjectExists.mockResolvedValue(true);
      repository.getMaxSchedulePosition.mockResolvedValue(null);
      repository.create.mockResolvedValue(buildPath({ id: 'new-id' }) as never);
      repository.update.mockResolvedValue(buildPath() as never);
      iconMedia.uploadPathIconFromBase64.mockResolvedValue('paths/new-id/abc.png');

      const result = await service.create({
        name: 'X',
        subjectId: 'subject-1',
        order: 1,
        icon: 'data:image/png;base64,iVBORw0KGgo=',
      });

      expect(result).toEqual({ id: 'new-id', message: 'Topic created successfully' });
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ icon_key: '' }));
      expect(iconMedia.uploadPathIconFromBase64).toHaveBeenCalledWith(
        'new-id',
        'data:image/png;base64,iVBORw0KGgo=',
      );
      expect(repository.update).toHaveBeenCalledWith('new-id', {
        icon_key: 'paths/new-id/abc.png',
      });
    });

    it('throws BadRequest when subject does not exist', async () => {
      repository.subjectExists.mockResolvedValue(false);

      await expect(
        service.create({ name: 'X', subjectId: 'missing', order: 1 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('maps Prisma P2002 to ConflictException (duplicate order in subject)', async () => {
      repository.subjectExists.mockResolvedValue(true);
      repository.getMaxSchedulePosition.mockResolvedValue(0);
      repository.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.create({ name: 'X', subjectId: 'subject-1', order: 1 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows non-conflict write errors as-is', async () => {
      repository.subjectExists.mockResolvedValue(true);
      repository.getMaxSchedulePosition.mockResolvedValue(0);
      repository.create.mockRejectedValue(new Error('db down'));

      await expect(service.create({ name: 'X', subjectId: 'subject-1', order: 1 })).rejects.toThrow(
        'db down',
      );
    });
  });

  describe('update', () => {
    it('throws NotFound when topic does not exist', async () => {
      repository.findById.mockResolvedValue(null as never);

      await expect(service.update('path-1', { name: 'Y' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('updates only provided fields, maps order -> trail_position and uploads a new icon', async () => {
      repository.findById.mockResolvedValue(buildPath() as never);
      repository.update.mockResolvedValue(buildPath() as never);
      iconMedia.uploadPathIconFromBase64.mockResolvedValue('paths/path-1/new.png');

      const result = await service.update('path-1', {
        name: 'Editado',
        order: 5,
        icon: 'data:image/png;base64,iVBORw0KGgo=',
      });

      expect(result).toEqual({ message: 'Topic updated successfully' });
      expect(iconMedia.uploadPathIconFromBase64).toHaveBeenCalledWith(
        'path-1',
        'data:image/png;base64,iVBORw0KGgo=',
      );
      expect(repository.update).toHaveBeenCalledWith('path-1', {
        name: 'Editado',
        trail_position: 5,
        icon_key: 'paths/path-1/new.png',
      });
    });

    it('validates the subject when subjectId is provided', async () => {
      repository.findById.mockResolvedValue(buildPath() as never);
      repository.subjectExists.mockResolvedValue(false);

      await expect(service.update('path-1', { subjectId: 'missing' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('reconnects the subject when a valid subjectId is provided', async () => {
      repository.findById.mockResolvedValue(buildPath() as never);
      repository.subjectExists.mockResolvedValue(true);
      repository.update.mockResolvedValue(buildPath() as never);

      const result = await service.update('path-1', { subjectId: 'subject-2', order: 3 });

      expect(result).toEqual({ message: 'Topic updated successfully' });
      expect(repository.update).toHaveBeenCalledWith('path-1', {
        trail_position: 3,
        subject: { connect: { id: 'subject-2' } },
      });
    });

    it('re-enables a soft-deleted topic via the enable flag', async () => {
      repository.findById.mockResolvedValue(buildPath({ enable: false }) as never);
      repository.update.mockResolvedValue(buildPath() as never);

      const result = await service.update('path-1', { enable: true });

      expect(result).toEqual({ message: 'Topic updated successfully' });
      expect(repository.update).toHaveBeenCalledWith('path-1', { enable: true });
    });

    it('maps Prisma P2002 to ConflictException on update', async () => {
      repository.findById.mockResolvedValue(buildPath() as never);
      repository.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'test' }),
      );

      await expect(service.update('path-1', { order: 2 })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('throws NotFound when topic does not exist', async () => {
      repository.findById.mockResolvedValue(null as never);

      await expect(service.remove('path-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('soft-deletes an existing topic', async () => {
      repository.findById.mockResolvedValue(buildPath() as never);
      repository.softDelete.mockResolvedValue(buildPath({ enable: false }) as never);

      const result = await service.remove('path-1');

      expect(result).toEqual({ message: 'Topic deleted successfully' });
      expect(repository.softDelete).toHaveBeenCalledWith('path-1');
    });
  });
});
