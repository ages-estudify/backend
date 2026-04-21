import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminQuestionsRepository } from './admin-questions.repository';
import { AdminQuestionsService } from './admin-questions.service';

type RepoMock = jest.Mocked<
  Pick<
    AdminQuestionsRepository,
    | 'create'
    | 'findMany'
    | 'findById'
    | 'update'
    | 'deleteAlternatives'
    | 'createAlternative'
    | 'findAllPaths'
    | 'findAllExams'
    | 'pathExists'
    | 'examExists'
  >
>;

describe('AdminQuestionsService', () => {
  let service: AdminQuestionsService;
  let repository: RepoMock;

  const baseAlternatives = [
    { letter: 'A', text: 'a', is_correct: true },
    { letter: 'B', text: 'b', is_correct: false },
    { letter: 'C', text: 'c', is_correct: false },
    { letter: 'D', text: 'd', is_correct: false },
    { letter: 'E', text: 'e', is_correct: false },
  ];

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      deleteAlternatives: jest.fn(),
      createAlternative: jest.fn(),
      findAllPaths: jest.fn(),
      findAllExams: jest.fn(),
      pathExists: jest.fn(),
      examExists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminQuestionsService,
        { provide: AdminQuestionsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<AdminQuestionsService>(AdminQuestionsService);
  });

  describe('create', () => {
    it('creates question when all validations pass', async () => {
      repository.pathExists.mockResolvedValue(true);
      repository.examExists.mockResolvedValue(true);
      repository.create.mockResolvedValue({ id: 'qid' } as never);

      const result = await service.create({
        text: 't',
        feedback: 'f',
        year: 2024,
        origin: 'ORIGINAL',
        path_id: 'path-id',
        alternatives: baseAlternatives,
      } as never);

      expect(result).toEqual({ id: 'qid' });
      expect(repository.create).toHaveBeenCalled();
    });

    it('throws BadRequestException when path does not exist', async () => {
      repository.pathExists.mockResolvedValue(false);

      await expect(
        service.create({
          text: 't',
          feedback: 'f',
          year: 2024,
          origin: 'ORIGINAL',
          path_id: 'path-id',
          alternatives: baseAlternatives,
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when alternatives are invalid', async () => {
      repository.pathExists.mockResolvedValue(true);

      const bad = baseAlternatives.map((a) => ({ ...a, is_correct: true }));
      await expect(
        service.create({
          text: 't',
          feedback: 'f',
          year: 2024,
          origin: 'ORIGINAL',
          path_id: 'path-id',
          alternatives: bad,
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('uses defaults for page/size and applies filters', async () => {
      repository.findMany.mockResolvedValue({ content: [], totalElements: 0 } as never);

      const result = await service.findAll({ path_id: 'p' } as never);

      expect(result).toEqual({ content: [], page: 0, size: 20, totalElements: 0 });
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ enable: true, path_id: 'p' }),
        0,
        20,
      );
    });
  });

  describe('findOne', () => {
    it('returns the question when found', async () => {
      repository.findById.mockResolvedValue({ id: 'qid' } as never);
      await expect(service.findOne('qid')).resolves.toEqual({ id: 'qid' });
    });

    it('throws NotFoundException when question does not exist', async () => {
      repository.findById.mockResolvedValue(null as never);
      await expect(service.findOne('qid')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes by setting enable=false', async () => {
      repository.findById.mockResolvedValue({ id: 'qid' } as never);
      repository.update.mockResolvedValue({ id: 'qid', enable: false } as never);

      await service.remove('qid');

      expect(repository.update).toHaveBeenCalledWith('qid', { enable: false });
    });
  });

  describe('importCsv', () => {
    it('imports successfully when row is valid', async () => {
      repository.pathExists.mockResolvedValue(true);
      repository.create.mockResolvedValue({ id: 'qid' } as never);

      const csv = [
        'path_id,text,feedback,year,origin,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer',
        'p1,Texto,Feedback,2024,ORIGINAL,a,b,c,d,e,C',
      ].join('\n');

      const result = await service.importCsv(Buffer.from(csv));

      expect(result.total).toBe(1);
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(0);
    });

    it('reports errors per row without stopping the import', async () => {
      const csv = [
        'path_id,text,feedback,year,origin,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer',
        ',Texto,Feedback,2024,ORIGINAL,a,b,c,d,e,C',
      ].join('\n');

      const result = await service.importCsv(Buffer.from(csv));

      expect(result.total).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.results[0].success).toBe(false);
    });

    it('reports error when correct_answer is invalid', async () => {
      const csv = [
        'path_id,text,feedback,year,origin,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer',
        'p1,Texto,Feedback,2024,ORIGINAL,a,b,c,d,e,Z',
      ].join('\n');

      const result = await service.importCsv(Buffer.from(csv));

      expect(result.errorCount).toBe(1);
      expect(result.results[0].error).toContain('correct_answer');
    });
  });
});
