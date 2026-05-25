import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AttemptDaysService } from './attempt-days.service';
import { AttemptDaysRepository } from './attempt-days.repository';
import { QuestionMediaService } from '../storage/question-media.service';

describe('AttemptDaysService', () => {
  let service: AttemptDaysService;
  let repository: {
    findAttemptDayForUserResult: jest.Mock;
    findQuestionsByExamDayId: jest.Mock;
  };

  const userId = '11111111-1111-1111-1111-111111111111';
  const attemptDayId = '22222222-2222-2222-2222-222222222222';
  const attemptId = '33333333-3333-3333-3333-333333333333';
  const examId = '44444444-4444-4444-4444-444444444444';
  const examDayId = '55555555-5555-5555-5555-555555555555';

  const alt = (id: string, letter: string, correct: boolean) => ({
    id,
    text: `Text ${letter}`,
    letter,
    is_correct: correct,
  });

  const baseAttemptDay = (overrides: Record<string, unknown> = {}) => ({
    id: attemptDayId,
    time_spent_seconds: 5990,
    current_question: 1,
    init_time: new Date('2026-03-12T10:00:00.000Z'),
    end_time: new Date('2026-03-12T18:32:10.000Z'),
    attempt_id: attemptId,
    exam_day_id: examDayId,
    attempt: {
      id: attemptId,
      exam_id: examId,
      user_id: userId,
      exam: { id: examId, name: 'Simulado ENEM - Novembro 2024', origin: 'x', media_key: null },
    },
    exam_day: { id: examDayId, day: 1, exam_id: examId },
    answers: [] as unknown[],
    ...overrides,
  });

  beforeEach(async () => {
    repository = {
      findAttemptDayForUserResult: jest.fn(),
      findQuestionsByExamDayId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptDaysService,
        { provide: AttemptDaysRepository, useValue: repository },
        {
          provide: QuestionMediaService,
          useValue: {
            resolveSignedUrl: jest
              .fn()
              .mockImplementation((key: string | null) => Promise.resolve(key)),
            resolveSignedUrls: jest
              .fn()
              .mockImplementation((keys: (string | null)[]) => Promise.resolve(keys)),
          },
        },
      ],
    }).compile();

    service = module.get(AttemptDaysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws NotFoundException when attempt day does not exist', async () => {
    repository.findAttemptDayForUserResult.mockResolvedValue(null);

    await expect(service.getAttemptDayResult(attemptDayId, userId)).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.getAttemptDayResult(attemptDayId, userId)).rejects.toMatchObject({
      message: 'Result not found',
    });
    expect(repository.findAttemptDayForUserResult).toHaveBeenCalledWith(attemptDayId, userId);
  });

  it('throws NotFoundException when attempt belongs to another user (findFirst returns null)', async () => {
    repository.findAttemptDayForUserResult.mockResolvedValue(null);

    await expect(
      service.getAttemptDayResult(attemptDayId, '99999999-9999-9999-9999-999999999999'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when end_time is null', async () => {
    repository.findAttemptDayForUserResult.mockResolvedValue(
      baseAttemptDay({ end_time: null, answers: [] }) as never,
    );

    await expect(service.getAttemptDayResult(attemptDayId, userId)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.getAttemptDayResult(attemptDayId, userId)).rejects.toMatchObject({
      message: 'Attempt day not finished yet',
    });
    expect(repository.findQuestionsByExamDayId).not.toHaveBeenCalled();
  });

  it('returns full result with totals scoped to the day and questions ordered by number asc', async () => {
    const qCorrect = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const qWrong = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const qBlankNull = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    const qNoAnswer = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

    const a1c = alt('a1111111-1111-1111-1111-111111111111', 'A', true);
    const a1w = alt('a1111111-1111-1111-1111-111111111112', 'B', false);
    const a2c = alt('a2222222-2222-2222-2222-222222222221', 'A', false);
    const a2w = alt('a2222222-2222-2222-2222-222222222222', 'B', true);

    repository.findAttemptDayForUserResult.mockResolvedValue(
      baseAttemptDay({
        answers: [
          {
            question_id: qCorrect,
            alternative_id: a1c.id,
            answer_date: new Date('2026-03-12T12:00:00.000Z'),
            alternative: { is_correct: true },
          },
          {
            question_id: qWrong,
            alternative_id: a2c.id,
            answer_date: new Date('2026-03-12T12:01:00.000Z'),
            alternative: { is_correct: false },
          },
          {
            question_id: qBlankNull,
            alternative_id: null,
            answer_date: new Date('2026-03-12T12:02:00.000Z'),
            alternative: null,
          },
        ],
      }) as never,
    );

    repository.findQuestionsByExamDayId.mockResolvedValue([
      {
        id: qCorrect,
        text: 'Q1',
        media_key: 'https://img.test/q1.png',
        feedback: 'fb1',
        number: 1,
        alternatives: [a1c, a1w],
      },
      {
        id: qWrong,
        text: 'Q2',
        media_key: null,
        feedback: 'fb2',
        number: 2,
        alternatives: [a2w, a2c],
      },
      {
        id: qBlankNull,
        text: 'Q3',
        media_key: null,
        feedback: 'fb3',
        number: 3,
        alternatives: [alt('c1', 'A', false), alt('c2', 'B', true)],
      },
      {
        id: qNoAnswer,
        text: 'Q4',
        media_key: null,
        feedback: 'fb4',
        number: 4,
        alternatives: [alt('d1', 'A', true), alt('d2', 'B', false)],
      },
    ] as never);

    const result = await service.getAttemptDayResult(attemptDayId, userId);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      attemptDayId,
      attemptId,
      examId,
      examDayId,
      name: 'Simulado ENEM - Novembro 2024',
      day: 1,
      timeSpentSeconds: 5990,
      endTime: '2026-03-12T18:32:10.000Z',
      totalQuestions: 4,
      answeredQuestions: 2,
      correctAnswers: 1,
      wrongAnswers: 1,
      blankAnswers: 2,
    });

    expect(repository.findQuestionsByExamDayId).toHaveBeenCalledWith(examDayId);

    expect(result.data.questions.map((q) => q.number)).toEqual([1, 2, 3, 4]);
    expect(result.data.questions[0]).toMatchObject({
      id: qCorrect,
      number: 1,
      selectedAlternativeId: a1c.id,
      correctAlternativeId: a1c.id,
      feedback: 'fb1',
      imageUrl: 'https://img.test/q1.png',
    });
    expect(result.data.questions[0].alternatives).toEqual([
      { id: a1c.id, letter: 'A', text: a1c.text },
      { id: a1w.id, letter: 'B', text: a1w.text },
    ]);

    expect(result.data.questions[1]).toMatchObject({
      id: qWrong,
      selectedAlternativeId: a2c.id,
      correctAlternativeId: a2w.id,
    });

    expect(result.data.questions[2].selectedAlternativeId).toBeNull();
    expect(result.data.questions[3].selectedAlternativeId).toBeNull();
    expect(result.data.questions.every((q) => q.correctAlternativeId && q.feedback)).toBe(true);
  });

  it('uses latest answer per question when multiple rows exist', async () => {
    const qid = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const oldAlt = alt('old-old-old-old-old-old-old-o1', 'A', true);
    const newAlt = alt('new-new-new-new-new-new-new-n1', 'B', false);

    repository.findAttemptDayForUserResult.mockResolvedValue(
      baseAttemptDay({
        answers: [
          {
            question_id: qid,
            alternative_id: oldAlt.id,
            answer_date: new Date('2026-03-12T10:00:00.000Z'),
            alternative: { is_correct: true },
          },
          {
            question_id: qid,
            alternative_id: newAlt.id,
            answer_date: new Date('2026-03-12T11:00:00.000Z'),
            alternative: { is_correct: false },
          },
        ],
      }) as never,
    );

    repository.findQuestionsByExamDayId.mockResolvedValue([
      {
        id: qid,
        text: 'Only',
        media_key: null,
        feedback: 'f',
        number: 1,
        alternatives: [oldAlt, newAlt],
      },
    ] as never);

    const result = await service.getAttemptDayResult(attemptDayId, userId);
    expect(result.data.questions[0].selectedAlternativeId).toBe(newAlt.id);
    expect(result.data.answeredQuestions).toBe(2);
    expect(result.data.correctAnswers).toBe(1);
    expect(result.data.wrongAnswers).toBe(1);
  });

  it('throws InternalServerErrorException when no alternative is marked correct', async () => {
    const qid = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const badAlts = [alt('x1', 'A', false), alt('x2', 'B', false)];

    repository.findAttemptDayForUserResult.mockResolvedValue(
      baseAttemptDay({ answers: [] }) as never,
    );
    repository.findQuestionsByExamDayId.mockResolvedValue([
      {
        id: qid,
        text: 'Bad',
        media_key: null,
        feedback: 'f',
        number: 1,
        alternatives: badAlts,
      },
    ] as never);

    await expect(service.getAttemptDayResult(attemptDayId, userId)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('sorts alternatives by letter', async () => {
    const qid = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const alts = [alt('l3', 'C', false), alt('l1', 'A', true), alt('l2', 'B', false)];

    repository.findAttemptDayForUserResult.mockResolvedValue(
      baseAttemptDay({ answers: [] }) as never,
    );
    repository.findQuestionsByExamDayId.mockResolvedValue([
      {
        id: qid,
        text: 'Q',
        media_key: null,
        feedback: 'f',
        number: 1,
        alternatives: alts,
      },
    ] as never);

    const result = await service.getAttemptDayResult(attemptDayId, userId);
    expect(result.data.questions[0].alternatives.map((a) => a.letter)).toEqual(['A', 'B', 'C']);
  });
});
