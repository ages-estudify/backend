import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExamService } from '../src/exam/exam.service';
import { ExamRepository } from '../src/exam/exam.repository';

describe('ExamService', () => {
  let service: ExamService;

  const repositoryMock = {
    findAttemptResultGridById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamService,
        {
          provide: ExamRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<ExamService>(ExamService);

    jest.clearAllMocks();
  });

  const mockAttempt = {
    id: 'attempt-uuid',
    attempt_days: [
      {
        exam_day: { day: 1 },
        answers: [
          {
            answer_date: new Date('2026-01-01T10:00:00Z'),
            question_id: 'q1',
            alternative_id: 'alt-a',
            question: {
              number: 1,
              alternatives: [{ letter: 'A', is_correct: true }],
            },
            alternative: { letter: 'A' },
          },
        ],
      },
    ],
  };

  it('deve retornar o grid de resultados com sucesso', async () => {
    repositoryMock.findAttemptResultGridById.mockResolvedValue(mockAttempt);

    const result = await service.getResultGrid('attempt-uuid', 'user-id-123');

    expect(result.success).toBe(true);
    expect(result.data.attemptId).toBe('attempt-uuid');
    expect(repositoryMock.findAttemptResultGridById).toHaveBeenCalledWith(
      'attempt-uuid',
      'user-id-123',
    );
  });

  it('deve lançar NotFoundException quando a tentativa não pertencer ao usuário', async () => {
    repositoryMock.findAttemptResultGridById.mockResolvedValue(null);

    await expect(service.getResultGrid('id-errado', 'user-id-123')).rejects.toThrow(
      NotFoundException,
    );
  });
});
