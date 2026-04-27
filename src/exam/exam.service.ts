import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ResultGridQueryDto, ResultGridStatusFilter } from './dto/result-grid-query.dto';
import type {
  ResultadoQuestao,
  ResultGridItemDto,
  ResultGridItemStatus,
} from './dto/result-grid-response.dto';

type AnswerWithRelations = {
  id: string;
  answer_date: Date;
  question_id: string;
  alternative_id: string | null;
  question: {
    id: string;
    number: number | null;
    alternatives: { id: string; letter: string; is_correct: boolean }[];
  };
  alternative: { letter: string } | null;
};

type AttemptDayWithAnswers = {
  exam_day: { day: number };
  answers: AnswerWithRelations[];
};

const FILTER_TO_STATUS: Record<ResultGridStatusFilter, ResultGridItemStatus> = {
  [ResultGridStatusFilter.CERTO]: 'CORRECT',
  [ResultGridStatusFilter.ERRADO]: 'WRONG',
  [ResultGridStatusFilter.NULO]: 'BLANK',
};

function toResultado(status: ResultGridItemStatus): ResultadoQuestao {
  switch (status) {
    case 'CORRECT':
      return 'CERTO';
    case 'WRONG':
      return 'ERRADO';
    case 'BLANK':
      return 'VAZIO';
  }
}

const ATTEMPT_RESULT_GRID_INCLUDE = {
  attempt_days: {
    include: {
      exam_day: { select: { day: true } },
      answers: {
        include: {
          question: {
            include: {
              alternatives: {
                select: { id: true, letter: true, is_correct: true },
              },
            },
          },
          alternative: { select: { letter: true } },
        },
      },
    },
  },
} as const;

@Injectable()
export class ExamService {
  constructor(private readonly prisma: PrismaService) {}

  async getResultGrid(attemptIdParam: string, query: ResultGridQueryDto) {
    const attempt = await this.loadAttemptForViewer(attemptIdParam);

    const rows: {
      examDayDay: number;
      answer: AnswerWithRelations;
    }[] = [];

    for (const ad of attempt.attempt_days as AttemptDayWithAnswers[]) {
      for (const answer of ad.answers) {
        rows.push({ examDayDay: ad.exam_day.day, answer });
      }
    }

    rows.sort((a, b) => {
      if (a.examDayDay !== b.examDayDay) {
        return a.examDayDay - b.examDayDay;
      }
      const na = a.answer.question.number;
      const nb = b.answer.question.number;
      if (na != null && nb != null && na !== nb) {
        return na - nb;
      }
      if (na != null && nb == null) {
        return -1;
      }
      if (na == null && nb != null) {
        return 1;
      }
      const t = a.answer.answer_date.getTime() - b.answer.answer_date.getTime();
      if (t !== 0) {
        return t;
      }
      return a.answer.question_id.localeCompare(b.answer.question_id);
    });

    const gridUnfiltered = rows.map(({ answer }, index) => {
      const built = this.buildGridItem(answer);
      const number = index + 1;
      return {
        questionId: built.questionId,
        number,
        resultado: toResultado(built.status),
        selectedAnswer: built.selectedAnswer,
        correctAnswer: built.correctAnswer,
        _status: built.status,
      };
    });

    const filters = query.statusFilter?.length
      ? new Set(query.statusFilter.map((f) => FILTER_TO_STATUS[f]))
      : null;

    const grid = filters
      ? gridUnfiltered.filter((item) => filters.has(item._status))
      : gridUnfiltered;

    const numberedGrid: ResultGridItemDto[] = grid.map(({ _status, ...item }) => item);

    return {
      success: true as const,
      data: {
        attemptId: attempt.id,
        totalQuestions: gridUnfiltered.length,
        grid: numberedGrid,
      },
    };
  }

  private buildGridItem(answer: AnswerWithRelations): {
    questionId: string;
    status: ResultGridItemStatus;
    selectedAnswer: string | null;
    correctAnswer: string | null;
  } {
    const correct = answer.question.alternatives.find((alt) => alt.is_correct);
    const correctAnswer = correct?.letter ?? null;

    const selectedAnswer = answer.alternative?.letter ?? null;

    let status: ResultGridItemStatus;
    if (!answer.alternative_id || selectedAnswer === null) {
      status = 'BLANK';
    } else if (correctAnswer != null && selectedAnswer === correctAnswer) {
      status = 'CORRECT';
    } else {
      status = 'WRONG';
    }

    return {
      questionId: answer.question_id,
      status,
      selectedAnswer,
      correctAnswer,
    };
  }


  /** Resolve por id de `Attempt` ou de `AttemptDay` (qualquer utilizador autenticado). */
  private async loadAttemptForViewer(attemptIdParam: string) {
    const byAttemptId = await this.prisma.attempt.findFirst({
      where: { id: attemptIdParam },
      include: ATTEMPT_RESULT_GRID_INCLUDE,
    });
    if (byAttemptId) {
      return byAttemptId;
    }

    const day = await this.prisma.attemptDay.findFirst({
      where: { id: attemptIdParam },
      select: { attempt_id: true },
    });
    if (!day) {
      throw new NotFoundException('Tentativa não encontrada');
    }

    const attempt = await this.prisma.attempt.findFirst({
      where: { id: day.attempt_id },
      include: ATTEMPT_RESULT_GRID_INCLUDE,
    });
    if (!attempt) {
      throw new NotFoundException('Tentativa não encontrada');
    }
    return attempt;
  }
}
