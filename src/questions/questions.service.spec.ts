import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsRepository } from './questions.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { SelectedAnswer } from './dto/answer-question.dto';
import { GamificationService } from '../gamification/gamification.service';
import { UsersRepository } from '../users/users.repository';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';

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

describe('QuestionsService', () => {
  let service: QuestionsService;
  let repository: any;
  let gamificationService: any;
  let usersRepository: any;

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

  beforeEach(async () => {
    const mockRepository = {
      pathExists: jest.fn(),
      countByPathAndType: jest.fn(),
      countAnsweredByUserInPath: jest.fn(),
      findByPathAndType: jest.fn(),
      findQuestionById: jest.fn(),
      createAnswer: jest.fn(),
    };

    const mockGamificationService = {
      earnCoins: jest.fn(),
    };

    const mockUsersRepository = {
      findUniqueById: jest.fn(),
    };

    const mockPrismaService = {
      attempt: { findUnique: jest.fn(), update: jest.fn() },
      attemptDay: { findFirst: jest.fn(), create: jest.fn() },
      answer: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
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
        {
          provide: PrismaService,
          useValue: mockPrismaService,
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

  it('should throw NotFoundException when topic does not exist', async () => {
    repository.pathExists.mockResolvedValue(false);

    await expect(
      service.getQuestionBatch('missing-topic', 'ORIGINAL', 5, true, true, 'user-id'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.pathExists).toHaveBeenCalledWith('missing-topic');
  });

  it('should return transformed questions without correctAnswer or explanation and calculate progress', async () => {
    repository.pathExists.mockResolvedValue(true);
    repository.countByPathAndType.mockResolvedValue(3);
    repository.countAnsweredByUserInPath.mockResolvedValue(1);

    repository.findByPathAndType.mockResolvedValueOnce([
      {
        id: 'q1',
        text: 'Pergunta 1',
        image_url: null,
        origin: 'ORIGINAL',
        subjectName: 'Matemática',
        topicName: 'Álgebra',
        alternatives: [
          { id: 'a1', text: 'A', letter: 'A', is_correct: false },
          { id: 'a2', text: 'B', letter: 'B', is_correct: true },
        ],
      },
    ] as never);

    const result = await service.getQuestionBatch(
      'topic-id',
      'ORIGINAL',
      10,
      true,
      true,
      'user-id',
    );

    expect(result.data).toBeDefined();
    expect(result.data?.questions).toHaveLength(1);
    expect(result.data?.questions[0]).toMatchObject({
      id: 'q1',
      text: 'Pergunta 1',
      imageUrl: null,
      origin: 'ORIGINAL',
      subjectName: 'Matemática',
      topicName: 'Álgebra',
      alternatives: [
        { label: 'A', text: 'A' },
        { label: 'B', text: 'B' },
      ],
    });

    expect(result.data?.sessionProgress).toEqual({
      current: 1,
      total: 3,
    });

    expect(result.data?.questions[0]).not.toHaveProperty('is_correct');
    expect(result.data?.questions[0]).not.toHaveProperty('correctAnswer');
  });

  it('should return data null when no questions are available', async () => {
    repository.pathExists.mockResolvedValue(true);
    repository.countByPathAndType.mockResolvedValue(2);
    repository.countAnsweredByUserInPath.mockResolvedValue(2);
    repository.findByPathAndType.mockResolvedValue([]);

    const result = await service.getQuestionBatch(
      'topic-id',
      'SIMPLIFIED',
      10,
      true,
      true,
      'user-id',
    );

    expect(result).toEqual({
      data: null,
      message: 'Todas as questões deste tipo foram respondidas neste tópico',
    });
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
