import { NotFoundException } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsRepository, QuestionResponse } from './questions.repository';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let questionsRepo: jest.Mocked<
    Pick<
      QuestionsRepository,
      'countAnsweredByUserInPath' | 'countByPathAndType' | 'findByPathAndType' | 'pathExists'
    >
  >;

  beforeEach(() => {
    questionsRepo = {
      countAnsweredByUserInPath: jest.fn(),
      countByPathAndType: jest.fn(),
      findByPathAndType: jest.fn(),
      pathExists: jest.fn(),
    };

    service = new QuestionsService(questionsRepo as unknown as QuestionsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException when topic does not exist', async () => {
    questionsRepo.pathExists.mockResolvedValue(false);

    await expect(
      service.getQuestionBatch('missing-topic', 'ORIGINAL', 5, true, true, 'user-id'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(questionsRepo.pathExists).toHaveBeenCalledWith('missing-topic');
  });

  it('should return transformed questions without correctAnswer or explanation and calculate progress', async () => {
    questionsRepo.pathExists.mockResolvedValue(true);
    questionsRepo.countByPathAndType.mockResolvedValue(3);
    questionsRepo.countAnsweredByUserInPath.mockResolvedValue(1);

    const repositoryResponse: QuestionResponse[] = [
      {
        id: 'q1',
        text: 'Pergunta 1',
        image_url: null,
        origin: 'ORIGINAL',
        alternatives: [
          { id: 'a1', text: 'A', letter: 'A', is_correct: false },
          { id: 'a2', text: 'B', letter: 'B', is_correct: true },
        ],
      },
    ];

    questionsRepo.findByPathAndType.mockResolvedValue(repositoryResponse);

    const result = await service.getQuestionBatch(
      'topic-id',
      'ORIGINAL',
      10,
      true,
      true,
      'user-id',
    );

    expect(result).toEqual({
      data: {
        questions: [
          {
            id: 'q1',
            text: 'Pergunta 1',
            imageUrl: null,
            type: 'ORIGINAL',
            alternatives: [
              { label: 'A', text: 'A' },
              { label: 'B', text: 'B' },
            ],
          },
        ],
        sessionProgress: {
          current: 1,
          total: 3,
        },
      },
    });

    expect(result.data.questions[0]).not.toHaveProperty('is_correct');
    expect(result.data.questions[0]).not.toHaveProperty('correctAnswer');
  });

  it('should return data null when no questions are available', async () => {
    questionsRepo.pathExists.mockResolvedValue(true);
    questionsRepo.countByPathAndType.mockResolvedValue(2);
    questionsRepo.countAnsweredByUserInPath.mockResolvedValue(2);
    questionsRepo.findByPathAndType.mockResolvedValue([]);

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
});
