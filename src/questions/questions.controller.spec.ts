/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { AnswerQuestionDto, SelectedAnswer } from './dto/answer-question.dto';
import { AnswerSuccessResponseDto } from './dto/answer-response.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('QuestionsController', () => {
  let controller: QuestionsController;
  let service: jest.Mocked<QuestionsService>;

  beforeEach(async () => {
    const mockService = {
      questionFeedback: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        {
          provide: QuestionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<QuestionsController>(QuestionsController);
    service = module.get(QuestionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('answerQuestion', () => {
    it('should return answer response for correct answer', async () => {
      const questionId = '026183d7-16b0-478a-a559-a087f6d3ba4e';
      const dto: AnswerQuestionDto = { selectedAnswer: SelectedAnswer.A };
      const result: AnswerSuccessResponseDto = {
        success: true,
        data: { isCorrect: true, correctAnswer: 'A', explanation: 'Good' },
      };
      service.questionFeedback.mockResolvedValue(result);

      const req = {
        user: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: Role.USER,
          planExpirationDate: null,
        },
      };
      const response = await controller.questionFeedback(questionId, dto, req);

      expect(response).toEqual(result);
      expect(service.questionFeedback).toHaveBeenCalledWith(
        questionId,
        '550e8400-e29b-41d4-a716-446655440000',
        SelectedAnswer.A,
      );
    });

    it('should return answer response for incorrect answer', async () => {
      const questionId = '026183d7-16b0-478a-a559-a087f6d3ba4e';
      const dto: AnswerQuestionDto = { selectedAnswer: SelectedAnswer.B };
      const result: AnswerSuccessResponseDto = {
        success: true,
        data: { isCorrect: false, correctAnswer: 'A', explanation: 'Wrong' },
      };
      service.questionFeedback.mockResolvedValue(result);

      const req = {
        user: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: Role.USER,
          planExpirationDate: null,
        },
      };
      const response = await controller.questionFeedback(questionId, dto, req);

      expect(response).toEqual(result);
      expect(service.questionFeedback).toHaveBeenCalledWith(
        questionId,
        '550e8400-e29b-41d4-a716-446655440000',
        SelectedAnswer.B,
      );
    });

    it('should allow multiple attempts', async () => {
      const questionId = '026183d7-16b0-478a-a559-a087f6d3ba4e';
      const dto: AnswerQuestionDto = { selectedAnswer: SelectedAnswer.A };
      const result: AnswerSuccessResponseDto = {
        success: true,
        data: { isCorrect: true, correctAnswer: 'A', explanation: 'Good' },
      };
      service.questionFeedback.mockResolvedValue(result);

      const req = {
        user: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: Role.USER,
          planExpirationDate: null,
        },
      };
      await controller.questionFeedback(questionId, dto, req);
      await controller.questionFeedback(questionId, dto, req);

      expect(service.questionFeedback).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException for invalid selectedAnswer', async () => {
      service.questionFeedback.mockRejectedValue(
        new BadRequestException('Invalid selected answer'),
      );

      const req = {
        user: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: Role.USER,
          planExpirationDate: null,
        },
      };
      await expect(
        controller.questionFeedback(
          '026183d7-16b0-478a-a559-a087f6d3ba4e',
          { selectedAnswer: 'Z' as any },
          req,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent question', async () => {
      service.questionFeedback.mockRejectedValue(new NotFoundException('Question not found'));

      const req = {
        user: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: Role.USER,
          planExpirationDate: null,
        },
      };
      await expect(
        controller.questionFeedback(
          '026183d7-16b0-478a-a559-a087f6d3ba4e',
          { selectedAnswer: SelectedAnswer.A },
          req,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
