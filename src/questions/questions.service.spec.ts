import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsRepository } from './questions.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { SelectedAnswer } from './dto/answer-question.dto';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let repository: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: QuestionsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    repository = mockRepository;
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

      const result = await service.questionFeedback('q1', 'u1', SelectedAnswer.A);

      expect(result).toEqual({
        success: true,
        data: {
          isCorrect: true,
          correctAnswer: 'A',
          explanation: 'Explanation',
        },
      });
      expect(repository.createAnswer).toHaveBeenCalledWith({
        user_id: 'u1',
        question_id: 'q1',
        alternative_id: 'a1',
        answer_date: expect.any(Date),
      });
    });

    it('should return incorrect for wrong selection', async () => {
      const question = createQuestion();
      repository.findQuestionById.mockResolvedValue(question as any);
      repository.createAnswer.mockResolvedValue({} as any);

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
      repository.findQuestionById.mockResolvedValue(null);

      await expect(service.questionFeedback('q1', 'u1', SelectedAnswer.A)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid selected answer', async () => {
      const question = createQuestion('q1', 'Explanation', [createAlternative('a1', 'A', true)]);
      repository.findQuestionById.mockResolvedValue(question as any);

      await expect(service.questionFeedback('q1', 'u1', 'Z')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for question with no correct answer', async () => {
      const question = createQuestion('q1', 'Explanation', [
        createAlternative('a1', 'A', false),
        createAlternative('a2', 'B', false),
      ]);
      repository.findQuestionById.mockResolvedValue(question as any);

      await expect(service.questionFeedback('q1', 'u1', SelectedAnswer.A)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
