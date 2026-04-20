import { Test, TestingModule } from '@nestjs/testing';
import { AttemptsService } from './attempts.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  exam: {
    findUnique: jest.fn(),
  },
  attempt: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  answer: {
    findMany: jest.fn(),
  },
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
    it('should throw NotFoundException if exam is not found in database', async () => {
      prisma.exam.findUnique.mockResolvedValue(null);
      await expect(service.create('invalid-uuid', 'invalid-user', 'SPANISH')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.exam.findUnique).toHaveBeenCalledTimes(1);
    });
    it('should return to existing attempt', async () => {
      const mockExam = { id: 'exam-123' };
      const mockExistingAttempt = { id: 'attempt-123', end_time: null }; 
      
      prisma.exam.findUnique.mockResolvedValue(mockExam);
      prisma.attempt.findFirst.mockResolvedValue(mockExistingAttempt);

      const result = await service.create('exam-123', 'user-123', 'pt-BR');

      expect(result).toEqual(mockExistingAttempt); 
      expect(prisma.attempt.create).not.toHaveBeenCalled(); 
    });

    it('should create a new attempt if exam exists and there is no other attempt', async () => {
      const mockExam = { id: 'exam-123' };
      const mockNewAttempt = { id: 'new-attempt-123', current_question: 1 };
      
      prisma.exam.findUnique.mockResolvedValue(mockExam);
      prisma.attempt.findFirst.mockResolvedValue(null); 
      prisma.attempt.create.mockResolvedValue(mockNewAttempt); 

      const result = await service.create('exam-123', 'user-123', 'pt-BR');

      expect(result).toEqual(mockNewAttempt);
      expect(prisma.attempt.create).toHaveBeenCalledTimes(1); 
    });
  });

  describe('update()', () => {
    it('should update the attempt successfully', async () => {
      const updateDto = { current_question: 2, time_spent_minutes: 15 };
      const mockUpdatedAttempt = { id: 'attempt-123', ...updateDto };

      prisma.attempt.update.mockResolvedValue(mockUpdatedAttempt);

      const result = await service.update('attempt-123', updateDto);

      expect(result).toEqual(mockUpdatedAttempt);
      expect(prisma.attempt.update).toHaveBeenCalledTimes(1);
      expect(prisma.attempt.update).toHaveBeenCalledWith({
        where: { id: 'attempt-123' },
        data: {
          current_question: updateDto.current_question,
          time_spent_minutes: updateDto.time_spent_minutes,
        },
      });
    });

    it('should throw NotFoundException if attempt is not found (P2025)', async () => {
      const updateDto = { current_question: 2, time_spent_minutes: 15 };
      
      const prismaError = new Error('Record to update not found.');
      (prismaError as any).code = 'P2025';
      
      prisma.attempt.update.mockRejectedValue(prismaError);

      await expect(
        service.update('invalid-uuid', updateDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('finish()', () => {
    it('should calculate score correctly and group by subject', async () => {
      const mockAttemptId = 'attempt-123';
      const mockSubjectId = 'sub-1';
      
      const mockAttemptWithExam = {
        id: mockAttemptId,
        exam: {
          questions: [
            {
              id: 'q1',
              alternatives: [{ id: 'alt-correct-1' }],
              path: { subject: { id: mockSubjectId, name: 'Matemática' } },
            },
            {
              id: 'q2',
              alternatives: [{ id: 'alt-correct-2' }],
              path: { subject: { id: mockSubjectId, name: 'Matemática' } },
            },
            {
              id: 'q3',
              alternatives: [{ id: 'alt-correct-3' }],
              path: { subject: { id: mockSubjectId, name: 'Matemática' } },
            },
          ],
        },
      };

      const mockUserAnswers = [
        { question_id: 'q1', alternative_id: 'alt-correct-1' },
        { question_id: 'q2', alternative_id: 'alt-wrong-2' },
      ];

      prisma.attempt.findUnique.mockResolvedValue(mockAttemptWithExam as any);
      prisma.answer.findMany.mockResolvedValue(mockUserAnswers as any);
      prisma.attempt.update.mockResolvedValue({ id: mockAttemptId, score: 1 });

      const result = await service.finish(mockAttemptId);
      
      expect(result.resultBySubject[0]).toEqual({
        subjectId: mockSubjectId,
        subjectName: 'Matemática',
        totalQuestions: 3,
        correctAnswers: 1,
        wrongAnswers: 1,
        blankAnswers: 1,
      });
      
      expect(prisma.attempt.update).toHaveBeenCalledWith({
        where: { id: mockAttemptId },
        data: expect.objectContaining({ score: 1 }),
      });
    });

    it('should throw NotFoundException if attempt does not exist', async () => {
      prisma.attempt.findUnique.mockResolvedValue(null);

      await expect(service.finish('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findLast()', () => {
    it('should return user last attempt', async () => {
      const mockAttempt = { id: 'last-1', end_time: null };
      prisma.attempt.findFirst.mockResolvedValue(mockAttempt);

      const result = await service.findLast('user-1');

      expect(result).toEqual(mockAttempt);
      expect(prisma.attempt.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-1', end_time: null },
        }),
      );
    });
  });
});
