import { Injectable, NotFoundException } from '@nestjs/common';
import { ExamRepository } from './exam.repository';
import { ResultGridQueryDto } from './dto/result-grid-query.dto';
import type { ResultGridItemDto, ResultGridItemStatus } from './dto/result-grid-item.dto';
import type { ResultGridSuccessResponseDto } from './dto/result-grid-response.dto';

type AnswerWithRelations = {
  answer_date: Date;
  question_id: string;
  alternative_id: string | null;
  question: {
    number: number | null;
    alternatives: {
      letter: string;
      is_correct: boolean;
    }[];
  };
  alternative: {
    letter: string;
  } | null;
};

type AttemptDayWithAnswers = {
  exam_day: {
    day: number;
  };
  answers: AnswerWithRelations[];
};

@Injectable()
export class ExamService {
  constructor(private readonly examRepository: ExamRepository) { }

  async getResultGrid(
    attemptId: string,
    userId: string,
    query?: ResultGridQueryDto,
  ): Promise<ResultGridSuccessResponseDto> {
    const attempt = await this.getAttempt(attemptId, userId);

    const answers = this.getOrderedAnswers(attempt.attempt_days as AttemptDayWithAnswers[]);

    const gridWithoutFilter = answers.map(({ answer }, index) => ({
      questionId: answer.question_id,
      number: index + 1,
      status: this.getQuestionStatus(answer),
    }));

    const grid = this.filterGridByStatus(gridWithoutFilter, query?.statusFilter);

    return {
      success: true,
      data: {
        attemptId: attempt.id,
        totalQuestions: gridWithoutFilter.length,
        grid,
      },
    };
  }

private async getAttempt(attemptId: string, userId: string) {
  const attempt = await this.examRepository.findAttemptResultGridById(
    attemptId,
    userId,
  );

  if (!attempt) {
    throw new NotFoundException('Attempt not found');
  }

  return attempt;
}

  private getOrderedAnswers(attemptDays: AttemptDayWithAnswers[]) {
    return attemptDays
      .flatMap((attemptDay) =>
        attemptDay.answers.map((answer) => ({
          examDayDay: attemptDay.exam_day.day,
          answer,
        })),
      )
      .sort((a, b) => this.sortAnswers(a, b));
  }

  private sortAnswers(
    a: { examDayDay: number; answer: AnswerWithRelations },
    b: { examDayDay: number; answer: AnswerWithRelations },
  ) {
    const dayDifference = a.examDayDay - b.examDayDay;

    if (dayDifference !== 0) {
      return dayDifference;
    }

    const questionNumberA = a.answer.question.number ?? Number.MAX_SAFE_INTEGER;
    const questionNumberB = b.answer.question.number ?? Number.MAX_SAFE_INTEGER;

    const questionDifference = questionNumberA - questionNumberB;

    if (questionDifference !== 0) {
      return questionDifference;
    }

    const dateDifference = a.answer.answer_date.getTime() - b.answer.answer_date.getTime();

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return a.answer.question_id.localeCompare(b.answer.question_id);
  }

  private filterGridByStatus(
    grid: ResultGridItemDto[],
    statusFilter?: ResultGridItemStatus[],
  ): ResultGridItemDto[] {
    if (!statusFilter?.length) {
      return grid;
    }

    return grid.filter((item) => statusFilter.includes(item.status));
  }

  private getQuestionStatus(answer: AnswerWithRelations): ResultGridItemStatus {
    if (!answer.alternative) {
      return 'BLANK';
    }

    const correctAlternative = answer.question.alternatives.find(
      (alternative) => alternative.is_correct,
    );

    if (answer.alternative.letter === correctAlternative?.letter) {
      return 'CORRECT';
    }

    return 'WRONG';
  }
}
