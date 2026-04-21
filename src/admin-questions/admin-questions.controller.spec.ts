import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminQuestionsController } from './admin-questions.controller';
import { AdminQuestionsService } from './admin-questions.service';

describe('AdminQuestionsController', () => {
  let controller: AdminQuestionsController;
  let service: jest.Mocked<
    Pick<
      AdminQuestionsService,
      | 'create'
      | 'findAll'
      | 'findOne'
      | 'update'
      | 'remove'
      | 'importCsv'
      | 'findAllPaths'
      | 'findAllExams'
    >
  >;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      importCsv: jest.fn(),
      findAllPaths: jest.fn(),
      findAllExams: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminQuestionsController],
      providers: [{ provide: AdminQuestionsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminQuestionsController>(AdminQuestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to service and wraps response', async () => {
    const dto = { text: 'q' } as never;
    const created = { id: 'qid' };
    service.create.mockResolvedValue(created as never);

    await expect(controller.create(dto)).resolves.toEqual({ success: true, data: created });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll delegates to service with query', async () => {
    const query = { page: 0, size: 20 } as never;
    const result = { content: [], page: 0, size: 20, totalElements: 0 };
    service.findAll.mockResolvedValue(result as never);

    await expect(controller.findAll(query)).resolves.toEqual({ success: true, data: result });
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('findOne delegates to service', async () => {
    const question = { id: 'qid' };
    service.findOne.mockResolvedValue(question as never);

    await expect(controller.findOne('qid')).resolves.toEqual({ success: true, data: question });
    expect(service.findOne).toHaveBeenCalledWith('qid');
  });

  it('update delegates to service', async () => {
    const dto = { text: 'new' } as never;
    const updated = { id: 'qid', text: 'new' };
    service.update.mockResolvedValue(updated as never);

    await expect(controller.update('qid', dto)).resolves.toEqual({ success: true, data: updated });
    expect(service.update).toHaveBeenCalledWith('qid', dto);
  });

  it('remove delegates to service', async () => {
    service.remove.mockResolvedValue(undefined as never);

    await expect(controller.remove('qid')).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith('qid');
  });

  it('findAllPaths delegates to service', async () => {
    const paths = [{ id: 'p1' }];
    service.findAllPaths.mockResolvedValue(paths as never);

    await expect(controller.findAllPaths()).resolves.toEqual({ success: true, data: paths });
  });

  it('findAllExams delegates to service', async () => {
    const exams = [{ id: 'e1' }];
    service.findAllExams.mockResolvedValue(exams as never);

    await expect(controller.findAllExams()).resolves.toEqual({ success: true, data: exams });
  });

  describe('importCsv', () => {
    it('throws BadRequestException when file is undefined', async () => {
      await expect(controller.importCsv(undefined)).rejects.toBeInstanceOf(BadRequestException);
      expect(service.importCsv).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when file buffer is missing', async () => {
      const file = { originalname: 'x.csv' } as Express.Multer.File;
      await expect(controller.importCsv(file)).rejects.toBeInstanceOf(BadRequestException);
      expect(service.importCsv).not.toHaveBeenCalled();
    });

    it('delegates to service when file is valid', async () => {
      const buffer = Buffer.from('col\nval');
      const file = { buffer } as Express.Multer.File;
      const result = { total: 1, successCount: 1, errorCount: 0, results: [] };
      service.importCsv.mockResolvedValue(result as never);

      await expect(controller.importCsv(file)).resolves.toEqual({
        success: true,
        data: result,
      });
      expect(service.importCsv).toHaveBeenCalledWith(buffer);
    });
  });
});
