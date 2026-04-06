import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsRepository } from './questions.repository';
import { PrismaService } from '../prisma.service';

describe('QuestionsRepository', () => {
  let repository: QuestionsRepository;
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
        QuestionsRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<QuestionsRepository>(QuestionsRepository);
    prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findQuestionById', () => {
    it('should return a question with alternatives', async () => {
      const question = {
        id: 'q1',
        feedback: 'Explanation',
        alternatives: [
          { id: 'a1', letter: 'A', is_correct: true },
          { id: 'a2', letter: 'B', is_correct: false },
        ],
      };
      prisma.question.findUnique.mockResolvedValue(question);

      const result = await repository.findQuestionById('q1');

      expect(result).toEqual(question);
      expect(prisma.question.findUnique).toHaveBeenCalledWith({
        where: { id: 'q1' },
        include: { alternatives: true },
      });
    });

    it('should return null if question not found', async () => {
      prisma.question.findUnique.mockResolvedValue(null);

      const result = await repository.findQuestionById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createAnswer', () => {
    it('should create an answer', async () => {
      const answer = {
        id: 'ans1',
        user_id: 'u1',
        question_id: 'q1',
        alternative_id: 'a1',
        answer_date: new Date(),
      };
      prisma.answer.create.mockResolvedValue(answer);

      const result = await repository.createAnswer({
        user_id: 'u1',
        question_id: 'q1',
        alternative_id: 'a1',
        answer_date: expect.any(Date),
      });

      expect(result).toEqual(answer);
      expect(prisma.answer.create).toHaveBeenCalled();
    });
  });
});
