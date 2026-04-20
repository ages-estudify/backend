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
    it('should create attempt and generate answer placeholders', async () => {
      const mockExam = { id: 'exam-1', questions: [{ id: 'q1' }, { id: 'q2' }] };
      const mockAttempt = { id: 'att-1', user_id: 'user-1' };

      prisma.exam.findUnique.mockResolvedValue(mockExam);
      prisma.attempt.findFirst.mockResolvedValue(null);
      prisma.attempt.create.mockResolvedValue(mockAttempt);

      const result = await service.create('exam-1', 'user-1', 'SPANISH');

      expect(result).toEqual(mockAttempt);
      expect(prisma.answer.createMany).toHaveBeenCalledWith({
        data: [
          {
            attempt_id: 'att-1',
            question_id: 'q1',
            user_id: 'user-1',
            answer_date: expect.any(Date),
          },
          {
            attempt_id: 'att-1',
            question_id: 'q2',
            user_id: 'user-1',
            answer_date: expect.any(Date),
          },
        ],
      });
    });
  });

  describe('update()', () => {
    const updateDto = { current_question: 5, time_spent_minutes: 20 };

    it('should update the attempt successfully', async () => {
      const mockAttempt = { id: 'att-1', user_id: 'user-1', end_time: null };
      prisma.attempt.findFirst.mockResolvedValue(mockAttempt);
      prisma.attempt.update.mockResolvedValue({ ...mockAttempt, ...updateDto });

      const result = await service.update('att-1', updateDto, 'user-1');

      expect(result.current_question).toBe(5);
      expect(prisma.attempt.update).toHaveBeenCalledWith({
        where: { id: 'att-1' },
        data: expect.objectContaining(updateDto),
      });
    });

    it('should throw BadRequestException if attempt is already closed', async () => {
      const closedAttempt = { id: 'att-1', end_time: new Date() };
      prisma.attempt.findFirst.mockResolvedValue(closedAttempt);

      await expect(service.update('att-1', updateDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if attempt is not found or belongs to another user', async () => {
      prisma.attempt.findFirst.mockResolvedValue(null);

      await expect(service.update('wrong-id', updateDto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('finish()', () => {
    it('should calculate score correctly and set end_time', async () => {
      const mockAttempt = {
        id: 'att-1',
        user_id: 'user-1',
        end_time: null,
        exam: {
          questions: [
            {
              id: 'q1',
              alternatives: [{ id: 'alt-correct' }],
              path: { subject: { id: 's1', name: 'Matemática' } },
            },
          ],
        },
      };

      const mockAnswers = [{ question_id: 'q1', alternative_id: 'alt-correct' }];

      prisma.attempt.findFirst.mockResolvedValue(mockAttempt);
      prisma.answer.findMany.mockResolvedValue(mockAnswers);
      prisma.attempt.update.mockResolvedValue({ ...mockAttempt, score: 1 });

      const result = await service.finish('att-1', 'user-1');

      expect(result.score).toBe(1);
      expect(result.resultBySubject[0].correctAnswers).toBe(1);
      expect(prisma.attempt.update).toHaveBeenCalledWith({
        where: { id: 'att-1' },
        data: expect.objectContaining({ score: 1, end_time: expect.any(Date) }),
      });
    });
  });

  describe('findLast()', () => {
    it('should return user last attemptfor a specific exam', async () => {
      const mockAttempt = { id: 'last-1', end_time: null };
      prisma.attempt.findFirst.mockResolvedValue(mockAttempt);

      const result = await service.findLast('user-1', 'exam-123');

      expect(result).toEqual(mockAttempt);
      expect(prisma.attempt.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_id: 'user-1',
            exam_id: 'exam-123',
            end_time: null,
          },
        }),
      );
    });
  });
});
