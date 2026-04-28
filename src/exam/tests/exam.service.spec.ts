import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExamService } from '../exam.service';
import { PrismaService } from '../../prisma.service';
import { ResultGridStatusFilter } from '../dto/result-grid-query.dto';
;

describe('ExamService', () => {
  let service: ExamService;

  const prismaMock = {
    attempt: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ExamService>(ExamService);
  });

  const mockAttempt = {
    id: 'attempt-uuid',
    attempt_days: [
      {
        exam_day: {
          day: 1,
        },
        answers: [
          {
            answer_date: new Date('2026-01-01T10:00:00Z'),
            question_id: 'question-1',
            alternative_id: 'alternative-a',
            question: {
              number: 1,
              alternatives: [
                {
                  letter: 'A',
                  is_correct: true,
                },
                {
                  letter: 'B',
                  is_correct: false,
                },
              ],
            },
            alternative: {
              letter: 'A',
            },
          },
          {
            answer_date: new Date('2026-01-01T10:01:00Z'),
            question_id: 'question-2',
            alternative_id: 'alternative-b',
            question: {
              number: 2,
              alternatives: [
                {
                  letter: 'A',
                  is_correct: false,
                },
                {
                  letter: 'C',
                  is_correct: true,
                },
              ],
            },
            alternative: {
              letter: 'B',
            },
          },
          {
            answer_date: new Date('2026-01-01T10:02:00Z'),
            question_id: 'question-3',
            alternative_id: null,
            question: {
              number: 3,
              alternatives: [
                {
                  letter: 'E',
                  is_correct: true,
                },
              ],
            },
            alternative: null,
          },
        ],
      },
    ],
  };

  it('should return the result grid without filters', async () => {
    prismaMock.attempt.findUnique.mockResolvedValue(mockAttempt);

    const result = await service.getResultGrid('attempt-uuid', {});

    expect(prismaMock.attempt.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'attempt-uuid',
      },
      include: expect.any(Object),
    });

    expect(result).toEqual({
      success: true,
      data: {
        attemptId: 'attempt-uuid',
        totalQuestions: 3,
        grid: [
          {
            questionId: 'question-1',
            number: 1,
            status: 'CORRECT',
          },
          {
            questionId: 'question-2',
            number: 2,
            status: 'WRONG',
          },
          {
            questionId: 'question-3',
            number: 3,
            status: 'BLANK',
          },
        ],
      },
    });
  });

  it('should filter by CORRECT without changing the original number', async () => {
    prismaMock.attempt.findUnique.mockResolvedValue(mockAttempt);

    const result = await service.getResultGrid('attempt-uuid', {
      statusFilter: [ResultGridStatusFilter.CORRECT],
    });

    expect(result.data.totalQuestions).toBe(3);
    expect(result.data.grid).toEqual([
      {
        questionId: 'question-1',
        number: 1,
        status: 'CORRECT',
      },
    ]);
  });

  it('should filter by WRONG without changing the original number', async () => {
    prismaMock.attempt.findUnique.mockResolvedValue(mockAttempt);

    const result = await service.getResultGrid('attempt-uuid', {
      statusFilter: [ResultGridStatusFilter.WRONG],
    });

    expect(result.data.totalQuestions).toBe(3);
    expect(result.data.grid).toEqual([
      {
        questionId: 'question-2',
        number: 2,
        status: 'WRONG',
      },
    ]);
  });

  it('should filter by BLANK without changing the original number', async () => {
    prismaMock.attempt.findUnique.mockResolvedValue(mockAttempt);

    const result = await service.getResultGrid('attempt-uuid', {
      statusFilter: [ResultGridStatusFilter.BLANK],
    });

    expect(result.data.totalQuestions).toBe(3);
    expect(result.data.grid).toEqual([
      {
        questionId: 'question-3',
        number: 3,
        status: 'BLANK',
      },
    ]);
  });

  it('should filter by multiple statuses', async () => {
    prismaMock.attempt.findUnique.mockResolvedValue(mockAttempt);

    const result = await service.getResultGrid('attempt-uuid', {
      statusFilter: [
        ResultGridStatusFilter.CORRECT,
        ResultGridStatusFilter.BLANK,
      ],
    });

    expect(result.data.totalQuestions).toBe(3);
    expect(result.data.grid).toEqual([
      {
        questionId: 'question-1',
        number: 1,
        status: 'CORRECT',
      },
      {
        questionId: 'question-3',
        number: 3,
        status: 'BLANK',
      },
    ]);
  });

  it('should keep the original order by exam day and question number', async () => {
    prismaMock.attempt.findUnique.mockResolvedValue({
      id: 'attempt-uuid',
      attempt_days: [
        {
          exam_day: {
            day: 2,
          },
          answers: [
            {
              answer_date: new Date('2026-01-01T10:03:00Z'),
              question_id: 'question-day-2',
              alternative_id: 'alternative-a',
              question: {
                number: 1,
                alternatives: [
                  {
                    letter: 'A',
                    is_correct: true,
                  },
                ],
              },
              alternative: {
                letter: 'A',
              },
            },
          ],
        },
        {
          exam_day: {
            day: 1,
          },
          answers: [
            {
              answer_date: new Date('2026-01-01T10:01:00Z'),
              question_id: 'question-day-1-number-2',
              alternative_id: 'alternative-b',
              question: {
                number: 2,
                alternatives: [
                  {
                    letter: 'B',
                    is_correct: true,
                  },
                ],
              },
              alternative: {
                letter: 'B',
              },
            },
            {
              answer_date: new Date('2026-01-01T10:00:00Z'),
              question_id: 'question-day-1-number-1',
              alternative_id: 'alternative-a',
              question: {
                number: 1,
                alternatives: [
                  {
                    letter: 'A',
                    is_correct: true,
                  },
                ],
              },
              alternative: {
                letter: 'A',
              },
            },
          ],
        },
      ],
    });

    const result = await service.getResultGrid('attempt-uuid', {});

    expect(result.data.grid).toEqual([
      {
        questionId: 'question-day-1-number-1',
        number: 1,
        status: 'CORRECT',
      },
      {
        questionId: 'question-day-1-number-2',
        number: 2,
        status: 'CORRECT',
      },
      {
        questionId: 'question-day-2',
        number: 3,
        status: 'CORRECT',
      },
    ]);
  });

  it('should throw NotFoundException when attempt does not exist', async () => {
    prismaMock.attempt.findUnique.mockResolvedValue(null);

    await expect(service.getResultGrid('invalid-attempt-id', {})).rejects.toThrow(
      NotFoundException,
    );
  });
});