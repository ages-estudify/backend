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
            findAllAttemptsByUser: jest.fn(),
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

  // =============================
  // 🔹 ADMIN / CRUD
  // =============================

  describe('listAllExams', () => {
    it('should list all exams', async () => {
      repository.findAllExams.mockResolvedValue([
        {
          id: 'exam1',
          name: 'Simulado ENEM',
          origin: 'ENEM',
          image_url: 'https://example.com/enem.png',
          exam_days: [],
          totalQuestions: 10,
        },
      ] as any);

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

      repository.findExamById.mockResolvedValue(exam as any);

      repository.updateExam.mockResolvedValue({
        ...exam,
        name: 'New Title',
      } as any);

      const result = await service.updateExam('exam1', {
        title: 'New Title',
      });

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('New Title');
    });

    it('should throw error if trying to publish without image', async () => {
      repository.findExamById.mockResolvedValue({
        id: 'exam1',
        name: 'Title',
        origin: 'ENEM',
        image_url: null,
        status: 'DRAFT',
      } as any);

      await expect(service.updateExam('exam1', { status: 'PUBLISHED' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteExamLogical', () => {
    it('should set exam status to ARCHIVED', async () => {
      repository.findExamById.mockResolvedValue({
        id: 'exam1',
        name: 'Title',
        origin: 'ENEM',
        image_url: null,
        status: 'PUBLISHED',
      } as any);

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

  describe('findAllWithLastAttemptByUser', () => {
    it('should merge exams with attempts correctly', async () => {
      repository.findAllExams.mockResolvedValue([
        {
          id: '1',
          name: 'Simulado 1',
          image_url: 'img',
          origin: 'EXTERNAL',
          exam_days: [{ _count: { questions: 10 } }, { _count: { questions: 20 } }],
          totalQuestions: 30,
        },
      ] as any);

      repository.findAllAttemptsByUser.mockResolvedValue([
        {
          exam_id: '1',
          isCompleted: true,
          totalAnswers: 25,
          attempt_days: [
            {
              exam_day: { day: 1 },
              _count: { answers: 10 },
              isCompleted: true,
            },
            {
              exam_day: { day: 2 },
              _count: { answers: 15 },
              isCompleted: true,
            },
          ],
        },
      ]);

      const result = await service.findAllWithLastAttemptByUser('user-1');

      const exam = result.data[0];

      expect(exam.totalQuestions).toBe(30);
      expect(exam.answeredQuestions).toBe(25);
      expect(exam.status).toBe('completed');
    });

    it('should return available when no attempts', async () => {
      repository.findAllExams.mockResolvedValue([
        {
          id: '2',
          name: 'Simulado 2',
          image_url: 'img',
          origin: 'EXTERNAL',
          exam_days: [{ _count: { questions: 10 } }],
          totalQuestions: 10,
        },
      ] as any);

      repository.findAllAttemptsByUser.mockResolvedValue([]);

      const result = await service.findAllWithLastAttemptByUser('user-1');

      expect(result.data[0].status).toBe('available');
    });

    it('should return in_progress when partial answers exist', async () => {
      repository.findAllExams.mockResolvedValue([
        {
          id: '3',
          name: 'Simulado 3',
          image_url: 'img',
          origin: 'EXTERNAL',
          exam_days: [{ _count: { questions: 10 } }],
          totalQuestions: 10,
        },
      ] as any);

      repository.findAllAttemptsByUser.mockResolvedValue([
        {
          exam_id: '3',
          isCompleted: false,
          totalAnswers: 5,
          attempt_days: [
            {
              exam_day: { day: 1 },
              _count: { answers: 5 },
              isCompleted: true,
            },
          ],
        },
      ]);

      const result = await service.findAllWithLastAttemptByUser('user-1');

      expect(result.data[0].status).toBe('in_progress');
    });
  });
});
