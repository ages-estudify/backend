import { BadRequestException } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

describe('QuestionsController', () => {
  let controller: QuestionsController;
  let questionsService: jest.Mocked<Pick<QuestionsService, 'getQuestionBatch'>>;

  beforeEach(() => {
    questionsService = {
      getQuestionBatch: jest.fn(),
    };
    controller = new QuestionsController(questionsService as unknown as QuestionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw BadRequestException when type is invalid', async () => {
    await expect(
      controller.getQuestionBatch(
        'topic-id',
        { userId: 'user-id' } as never,
        'INVALID',
        '10',
        'true',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(questionsService.getQuestionBatch).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when limit is outside allowed interval', async () => {
    await expect(
      controller.getQuestionBatch(
        'topic-id',
        { userId: 'user-id' } as never,
        'ORIGINAL',
        '0',
        'true',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      controller.getQuestionBatch(
        'topic-id',
        { userId: 'user-id' } as never,
        'ORIGINAL',
        '21',
        'true',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(questionsService.getQuestionBatch).not.toHaveBeenCalled();
  });

  it('should call service with parsed values and default excludeAnswered when query param is omitted', async () => {
    const expected = { data: { questions: [], sessionProgress: { current: 0, total: 0 } } };
    questionsService.getQuestionBatch.mockResolvedValue(expected as never);

    const result = await controller.getQuestionBatch(
      'topic-id',
      { userId: 'user-id' } as never,
      'ORIGINAL',
    );

    expect(result).toEqual(expected);
    expect(questionsService.getQuestionBatch).toHaveBeenCalledWith(
      'topic-id',
      'ORIGINAL',
      10,
      true,
      true,
      'user-id',
    );
  });

  it('should call service with excludeAnswered false when query param is explicitly false', async () => {
    const expected = { data: { questions: [], sessionProgress: { current: 0, total: 0 } } };
    questionsService.getQuestionBatch.mockResolvedValue(expected as never);

    const result = await controller.getQuestionBatch(
      'topic-id',
      { userId: 'user-id' } as never,
      'SIMPLIFIED',
      '5',
      'false',
    );

    expect(result).toEqual(expected);
    expect(questionsService.getQuestionBatch).toHaveBeenCalledWith(
      'topic-id',
      'SIMPLIFIED',
      5,
      false,
      true,
      'user-id',
    );
  });

  it('should call service with retrieveWrong false when query param is explicitly false', async () => {
    const expected = { data: { questions: [], sessionProgress: { current: 0, total: 0 } } };
    questionsService.getQuestionBatch.mockResolvedValue(expected as never);

    const result = await controller.getQuestionBatch(
      'topic-id',
      { userId: 'user-id' } as never,
      'ORIGINAL',
      '10',
      'false',
      'false',
    );

    expect(result).toEqual(expected);
    expect(questionsService.getQuestionBatch).toHaveBeenCalledWith(
      'topic-id',
      'ORIGINAL',
      10,
      false,
      false,
      'user-id',
    );
  });
});
