import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { QuestionsRepository } from './questions.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SelectedAnswer } from './dto/answer-question.dto';
import { GamificationService } from '../gamification/gamification.service';
import { UsersRepository } from '../users/users.repository';
import { Role } from '@prisma/client';

const createUserBuilder = (overrides: Partial<any> = {}) => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  full_name: 'Test User',
  email: 'test@example.com',
  phone_number: '123456789',
  role: Role.USER,
  plan_end_date: null,
  streak: null,
  coins: 0,
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  enable: true,
  desired_course: null,
  desired_exam: null,
  last_active: null,
  birth_date: null,
  ...overrides,
});

const createAlternative = (id: string, letter: string, is_correct: boolean) => ({
  id,
  letter,
  is_correct,
});

const createQuestion = (
  id: string = 'q1',
  feedback: string = 'Explanation',
  alternatives: any[] = [createAlternative('a1', 'A', true), createAlternative('a2', 'B', false)],
) => ({
  id,
  feedback,
  alternatives,
});

describe('QuestionsService', () => {
  let service: QuestionsService;
  let repository: any;
  let gamificationService: any;
  let usersRepository: any;

  beforeEach(async () => {
    const mockRepository = {
      findQuestionById: jest.fn(),
      createAnswer: jest.fn(),
    };

    const mockGamificationService = {
      earnCoins: jest.fn(),
    };

    const mockUsersRepository = {
      findUniqueById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: QuestionsRepository,
          useValue: mockRepository,
        },
        {
          provide: GamificationService,
          useValue: mockGamificationService,
        },
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    repository = mockRepository;
    gamificationService = mockGamificationService;
    usersRepository = mockUsersRepository;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('questionFeedback', () => {
    it('should return correct answer for valid question and correct selection', async () => {
      const question = createQuestion();
      repository.findQuestionById.mockResolvedValue(question as any);
      repository.createAnswer.mockResolvedValue({} as any);
      gamificationService.earnCoins.mockResolvedValue({ coinsEarned: 1, totalCoins: 11 });
      usersRepository.findUniqueById.mockResolvedValue(createUserBuilder({ id: 'u1' }));

      const result = await service.questionFeedback('q1', 'u1', SelectedAnswer.A);

      expect(result).toEqual({
        success: true,
        data: {
          isCorrect: true,
          correctAnswer: 'A',
          explanation: 'Explanation',
          coinsEarned: 1,
          totalCoins: 11,
        },
      });
      expect(repository.createAnswer).toHaveBeenCalledWith({
        user_id: 'u1',
        question_id: 'q1',
        alternative_id: 'a1',
        answer_date: expect.any(Date),
      });
      expect(gamificationService.earnCoins).toHaveBeenCalledWith({
        userId: 'u1',
        isCorrect: true,
        isSimulated: false,
      });
    });

    it('should return incorrect for wrong selection', async () => {
      const question = createQuestion();
      repository.findQuestionById.mockResolvedValue(question as any);
      repository.createAnswer.mockResolvedValue({} as any);
      gamificationService.earnCoins.mockResolvedValue({ coinsEarned: 0, totalCoins: 10 });
      usersRepository.findUniqueById.mockResolvedValue(createUserBuilder({ id: 'u1' }));

      const result = await service.questionFeedback('q1', 'u1', SelectedAnswer.B);

      expect(result).toEqual({
        success: true,
        data: {
          isCorrect: false,
          correctAnswer: 'A',
          explanation: 'Explanation',
          coinsEarned: 0,
          totalCoins: 10,
        },
      });
      expect(gamificationService.earnCoins).toHaveBeenCalledWith({
        userId: 'u1',
        isCorrect: false,
        isSimulated: false,
      });
    });

    it('should throw NotFoundException for non-existent question', async () => {
      repository.findQuestionById.mockResolvedValue(null);
      usersRepository.findUniqueById.mockResolvedValue(createUserBuilder({ id: 'u1' }));

      await expect(service.questionFeedback('q1', 'u1', SelectedAnswer.A)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid selected answer', async () => {
      const question = createQuestion('q1', 'Explanation', [createAlternative('a1', 'A', true)]);
      repository.findQuestionById.mockResolvedValue(question as any);
      usersRepository.findUniqueById.mockResolvedValue(createUserBuilder({ id: 'u1' }));

      await expect(service.questionFeedback('q1', 'u1', 'Z')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for question with no correct answer', async () => {
      const question = createQuestion('q1', 'Explanation', [
        createAlternative('a1', 'A', false),
        createAlternative('a2', 'B', false),
      ]);
      repository.findQuestionById.mockResolvedValue(question as any);
      usersRepository.findUniqueById.mockResolvedValue(createUserBuilder({ id: 'u1' }));

      await expect(service.questionFeedback('q1', 'u1', SelectedAnswer.A)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      usersRepository.findUniqueById.mockResolvedValue(null);

      await expect(service.questionFeedback('q1', 'u1', SelectedAnswer.A)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
