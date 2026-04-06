import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { QuestionsRepository } from './questions.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SelectedAnswer } from './dto/answer-question.dto';

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

  beforeEach(async () => {
    const mockRepository = {
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
