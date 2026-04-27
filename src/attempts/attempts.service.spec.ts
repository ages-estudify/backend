import { Test, TestingModule } from '@nestjs/testing';
import { AttemptsService } from './attempts.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockPrismaService = {
  exam: {
    findUnique: jest.fn(),
  },
  attempt: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  answer: {
    findMany: jest.fn(),
    createMany: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaService)),
};

describe('AttemptsService', () => {
  let service: AttemptsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AttemptsService>(AttemptsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create attempt and return it inside the success envelope', async () => {
      const mockExam = { id: 'exam-1', questions: [{ id: 'q1' }, { id: 'q2' }] };
      const mockAttempt = {
        id: 'att-1',
        user_id: 'user-1',
        exam_id: 'exam-1',
        language: 'ENGLISH',
        current_question: 1,
        time_spent_seconds: 0,
      };

      prisma.exam.findUnique.mockResolvedValue(mockExam);
      prisma.attempt.findFirst.mockResolvedValue(null);
      prisma.attempt.create.mockResolvedValue(mockAttempt);

      const result = await service.create('exam-1', 'user-1', 'ENGLISH');

      expect(prisma.attempt.create).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: { attempt: mockAttempt } });
    });
  });

  describe('update()', () => {
    const updateDto = { current_question: 5, timeSpentSeconds: 1200 };

    it('should update the attempt successfully and return the envelope', async () => {
      const mockAttempt = {
        id: 'att-1',
        user_id: 'user-1',
        end_time: null,
        time_spent_seconds: 600,
      };
      const updatedAttempt = { ...mockAttempt, current_question: 5, time_spent_seconds: 1200 };

      prisma.attempt.findFirst.mockResolvedValue(mockAttempt);
      prisma.attempt.update.mockResolvedValue(updatedAttempt);

      const result = await service.update('att-1', updateDto, 'user-1');

      expect(prisma.attempt.update).toHaveBeenCalledWith({
        where: { id: 'att-1' },
        data: {
          current_question: 5,
          time_spent_seconds: 1200,
        },
      });
      expect(result).toEqual({ success: true, data: { attempt: updatedAttempt } });
    });

    it('should throw BadRequestException if time regresses', async () => {
      const mockAttempt = {
        id: 'att-1',
        user_id: 'user-1',
        end_time: null,
        time_spent_seconds: 2000,
      };
      prisma.attempt.findFirst.mockResolvedValue(mockAttempt);

      await expect(service.update('att-1', updateDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if attempt is already closed', async () => {
      const closedAttempt = { id: 'att-1', end_time: new Date() };
      prisma.attempt.findFirst.mockResolvedValue(closedAttempt);

      await expect(service.update('att-1', updateDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('finish()', () => {
    it('should calculate score correctly and return the full result object', async () => {
      const mockAttempt = {
        id: 'att-1',
        user_id: 'user-1',
        end_time: null,
        exam: {
          exam_days: [
            {
              questions: [
                {
                  id: 'q1',
                  alternatives: [{ id: 'alt-correct' }],
                  path: { subject: { id: 's1', name: 'Matemática' } },
                },
              ],
            },
          ],
        },
      };

      const mockAnswers = [{ question_id: 'q1', alternative_id: 'alt-correct' }];

      prisma.attempt.findFirst.mockResolvedValue(mockAttempt);
      prisma.answer.findMany.mockResolvedValue(mockAnswers);
      prisma.attempt.update.mockResolvedValue({
        id: 'att-1',
        exam_id: 'exam-1',
        score: 1,
        time_spent_seconds: 500,
        end_time: new Date(),
      });

      const result = await service.finish('att-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.data.score).toBe(1);
      expect(result.data.totalQuestions).toBe(1);
      expect(result.data.correctAnswers).toBe(1);
      expect(result.data.resultBySubject[0].subjectName).toBe('Matemática');

      expect(prisma.attempt.update).toHaveBeenCalledWith({
        where: { id: 'att-1' },
        data: expect.objectContaining({ score: 1, end_time: expect.any(Date) }),
      });
    });
  });

  describe('findLast()', () => {
    it('should return hydrated attempt inside the success envelope', async () => {
      const mockAttempt = {
        id: 'att-1',
        end_time: null,
        exam: {
          exam_days: [
            {
              day: 1,
              questions: [{ id: 'q1', number: 1, text: 'Test', alternatives: [] }],
            },
          ],
        },
      };

      prisma.attempt.findFirst.mockResolvedValue(mockAttempt);
      prisma.answer.findMany.mockResolvedValue([]);

      const result = await service.findLast('user-1', 'exam-123');

      expect(result.success).toBe(true);
      expect(result.data.questions).toHaveLength(1);
      expect(result.data.questions[0].id).toBe('q1');
      expect(result.data.questions[0].selectedAlternativeId).toBeNull();
    });

    it('should throw NotFoundException if no active attempt exists', async () => {
      prisma.attempt.findFirst.mockResolvedValue(null);
      await expect(service.findLast('user-1', 'exam-123')).rejects.toThrow(NotFoundException);
    });
  });
});
