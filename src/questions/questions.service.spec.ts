import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SelectedAnswer } from './dto/answer-question.dto';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrisma = {
      question: {
        findUnique: jest.fn(),
      },
      answer: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('questionFeedback', () => {
    it('should return correct answer for valid question and correct selection', async () => {
      const question = {
        id: 'q1',
        feedback: 'Explanation',
        alternatives: [
          { id: 'a1', letter: 'A', is_correct: true },
          { id: 'a2', letter: 'B', is_correct: false },
        ],
      };
      prisma.question.findUnique.mockResolvedValue(question as any);
      prisma.answer.create.mockResolvedValue({} as any);

      const result = await service.questionFeedback('q1', 'u1', SelectedAnswer.A);

      expect(result).toEqual({
        success: true,
        data: {
          isCorrect: true,
          correctAnswer: 'A',
          explanation: 'Explanation',
        },
      });
      expect(prisma.answer.create).toHaveBeenCalledWith({
        data: {
          user_id: 'u1',
          question_id: 'q1',
          alternative_id: 'a1',
          answer_date: expect.any(Date),
        },
      });
    });

    it('should return incorrect for wrong selection', async () => {
      const question = {
        id: 'q1',
        feedback: 'Explanation',
        alternatives: [
          { id: 'a1', letter: 'A', is_correct: true },
          { id: 'a2', letter: 'B', is_correct: false },
        ],
      };
      prisma.question.findUnique.mockResolvedValue(question as any);
      prisma.answer.create.mockResolvedValue({} as any);

      const result = await service.questionFeedback('q1', 'u1', SelectedAnswer.B);

      expect(result).toEqual({
        success: true,
        data: {
          isCorrect: false,
          correctAnswer: 'A',
          explanation: 'Explanation',
        },
      });
    });

    it('should throw NotFoundException for non-existent question', async () => {
      prisma.question.findUnique.mockResolvedValue(null);

      await expect(service.questionFeedback('q1', 'u1', SelectedAnswer.A)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid selected answer', async () => {
      const question = {
        id: 'q1',
        feedback: 'Explanation',
        alternatives: [{ id: 'a1', letter: 'A', is_correct: true }],
      };
      prisma.question.findUnique.mockResolvedValue(question as any);

      await expect(service.questionFeedback('q1', 'u1', 'Z')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for question with no correct answer', async () => {
      const question = {
        id: 'q1',
        feedback: 'Explanation',
        alternatives: [
          { id: 'a1', letter: 'A', is_correct: false },
          { id: 'a2', letter: 'B', is_correct: false },
        ],
      };
      prisma.question.findUnique.mockResolvedValue(question as any);

      await expect(service.questionFeedback('q1', 'u1', SelectedAnswer.A)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
