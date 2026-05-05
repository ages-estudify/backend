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
            findAttemptResultGridById: jest.fn(),
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
    it('should list all exams with days and question counts', async () => {
      repository.findAllExams.mockResolvedValue([
        {
          id: 'exam1',
          name: 'Simulado ENEM',
          origin: 'ENEM',
          image_url: 'https://example.com/enem.png',
          status: 'DRAFT',
          exam_days: [
            {
              id: 'day1',
              day: 1,
              exam_id: 'exam1',
              questions: [
                {
                  id: 'q1',
                  number: 1,
                  origin: 'ENEM',
                  image_url: null,
                  exam_id: 'exam1',
                  text: '',
                  year: 2024,
                  feedback: '',
                  language: null,
                  path_id: '',
                  exam_day_id: 'day1',
                },
                {
                  id: 'q2',
                  number: 2,
                  origin: 'ENEM',
                  image_url: null,
                  exam_id: 'exam1',
                  text: '',
                  year: 2024,
                  feedback: '',
                  language: null,
                  path_id: '',
                  exam_day_id: 'day1',
                },
              ],
              _count: { questions: 2 },
            },
          ],
          totalQuestions: 2,
        },
      ] as unknown as Awaited<ReturnType<ExamsRepository['findAllExams']>>);

      repository.countQuestionsByExam.mockResolvedValue(2);

      const result = await service.listAllExams();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Simulado ENEM');
    });
  });

  describe('updateExam', () => {
    it('should update exam title', async () => {
      repository.findExamById.mockResolvedValue({
        id: 'exam1',
        name: 'Old Title',
        origin: 'ENEM',
        image_url: 'https://example.com/old.png',
        status: 'DRAFT',
        created_at: new Date(),
        updated_at: new Date(),
      } as unknown as Awaited<ReturnType<ExamsRepository['findExamById']>>);

      repository.updateExam.mockResolvedValue({
        id: 'exam1',
        name: 'New Title',
        origin: 'ENEM',
        image_url: 'https://example.com/old.png',
        status: 'DRAFT',
        created_at: new Date(),
        updated_at: new Date(),
      } as unknown as Awaited<ReturnType<ExamsRepository['updateExam']>>);

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
        created_at: new Date(),
        updated_at: new Date(),
      } as unknown as Awaited<ReturnType<ExamsRepository['findExamById']>>);

      await expect(service.updateExam('exam1', { status: 'PUBLISHED' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteExamLogical', () => {
    it('should call delete when exam exists', async () => {
      repository.findExamById.mockResolvedValue({
        id: 'exam1',
        name: 'Title',
        origin: 'ENEM',
        image_url: null,
        status: 'PUBLISHED',
        created_at: new Date(),
        updated_at: new Date(),
      } as unknown as Awaited<ReturnType<ExamsRepository['findExamById']>>);

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
    it('should merge exams with attempts correctly (completed)', async () => {
      repository.findAllExams.mockResolvedValue([
        {
          id: '1',
          name: 'Simulado 1',
          image_url: 'img',
          origin: 'EXTERNAL',
          status: 'DRAFT',
          exam_days: [{ _count: { questions: 10 } }, { _count: { questions: 20 } }],
          totalQuestions: 30,
        },
      ] as unknown as Awaited<ReturnType<ExamsRepository['findAllExams']>>);

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
      ] as unknown as Awaited<ReturnType<ExamsRepository['findAllAttemptsByUser']>>);

      const result = await service.findAllWithLastAttemptByUser('user-1');

      const exam = result.data[0];

      expect(exam.totalQuestions).toBe(30);
      expect(exam.answeredQuestions).toBe(25);
      expect(exam.status).toBe('completed');
    });
  });

  describe('getResultGrid', () => {
    const mockAttempt = {
      id: 'attempt-uuid',
      attempt_days: [
        {
          exam_day: { day: 1 },
          answers: [
            {
              answer_date: new Date('2026-01-01T10:00:00Z'),
              question_id: 'q1',
              alternative_id: 'alt-a',
              question: {
                number: 1,
                alternatives: [{ letter: 'A', is_correct: true }],
              },
              alternative: { letter: 'A' },
            },
          ],
        },
      ],
    };

    it('should return result grid successfully', async () => {
      repository.findAttemptResultGridById.mockResolvedValue(
        mockAttempt as unknown as Awaited<ReturnType<ExamsRepository['findAttemptResultGridById']>>,
      );

      const result = await service.getResultGrid('attempt-uuid', 'user-id-123');

      expect(result.success).toBe(true);
      expect(result.data.attemptId).toBe('attempt-uuid');
    });

    it('should throw NotFoundException when attempt not found', async () => {
      repository.findAttemptResultGridById.mockResolvedValue(null);

      await expect(service.getResultGrid('id-errado', 'user-id-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
