import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsRepository } from './exams.repository';
import { PrismaService } from '../prisma.service';

describe('ExamsService', () => {
  let service: ExamsService;
  let repository: jest.Mocked<ExamsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        {
          provide: ExamsRepository,
          useValue: {
            findAllExams: jest.fn(),
            findExamById: jest.fn(),
            countQuestionsByExam: jest.fn(),
            pathByNameAndSubject: jest.fn(),
            updateExam: jest.fn(),
            deleteExamLogical: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ExamsService);
    repository = module.get(ExamsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listAllExams', () => {
    it('should list all exams with their days and question counts', async () => {
      const mockExams = [
        {
          id: 'exam1',
          name: 'Simulado ENEM',
          origin: 'ENEM',
          image_url: 'https://example.com/enem.png',
          status: 'PUBLISHED',
          exam_days: [
            {
              id: 'day1',
              day: 1,
              exam_id: 'exam1',
              questions: [{ id: 'q1' }, { id: 'q2' }],
            },
          ],
        },
      ];

      repository.findAllExams.mockResolvedValue(
        mockExams as unknown as Awaited<ReturnType<ExamsRepository['findAllExams']>>,
      );

      repository.countQuestionsByExam.mockResolvedValue(2);

      const result = await service.listAllExams();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Simulado ENEM');
    });
  });

  describe('updateExam', () => {
    it('should update exam title', async () => {
      const exam = {
        id: 'exam1',
        name: 'Old Title',
        origin: 'ENEM',
        image_url: 'https://example.com/old.png',
        status: 'DRAFT',
      };

      repository.findExamById.mockResolvedValue(
        exam as Awaited<ReturnType<ExamsRepository['findExamById']>>,
      );

      repository.updateExam.mockResolvedValue({
        ...exam,
        name: 'New Title',
      } as Awaited<ReturnType<ExamsRepository['updateExam']>>);

      const result = await service.updateExam('exam1', {
        title: 'New Title',
      });

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('New Title');
    });

    it('should throw error if trying to publish without image', async () => {
      const exam = {
        id: 'exam1',
        name: 'Title',
        origin: 'ENEM',
        image_url: null,
        status: 'DRAFT',
      };

      repository.findExamById.mockResolvedValue(
        exam as Awaited<ReturnType<ExamsRepository['findExamById']>>,
      );

      await expect(service.updateExam('exam1', { status: 'PUBLISHED' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteExamLogical', () => {
    it('should set exam status to ARCHIVED', async () => {
      const exam = {
        id: 'exam1',
        name: 'Title',
        origin: 'ENEM',
        image_url: null,
        status: 'PUBLISHED',
      };

      repository.findExamById.mockResolvedValue(
        exam as Awaited<ReturnType<ExamsRepository['findExamById']>>,
      );

      const spy = jest.spyOn(repository, 'deleteExamLogical');
      spy.mockResolvedValue(undefined);

      await service.deleteExamLogical('exam1');

      expect(spy).toHaveBeenCalledWith('exam1');
    });

    it('should throw error if exam does not exist', async () => {
      repository.findExamById.mockResolvedValue(null);

      await expect(service.deleteExamLogical('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
