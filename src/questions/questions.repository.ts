import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, Question, Answer } from '@prisma/client';

export type QuestionResponse = {
  id: string;
  text: string;
  media_key: string | null;
  origin: 'ORIGINAL' | 'EXTERNAL';
  subjectName: string;
  topicName: string;
  alternatives: {
    id: string;
    text: string;
    letter: string;
    is_correct: boolean;
  }[];
};

export type QuestionWithAlternatives = Question & {
  alternatives: Prisma.AlternativeGetPayload<true>[];
};

@Injectable()
export class QuestionsRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findByPathAndType(
    pathId: string,
    type: string,
    excludeAnswered: boolean,
    retrieveWrong: boolean,
    userId?: string,
    limit?: number,
  ): Promise<QuestionResponse[]> {
    const origin = this.getOrigin(type);
    const limitNum = limit || 10;
    const baseWhere: any = {
      exam_day_id: null,
      path_id: pathId,
      origin,
    };

    if (excludeAnswered || !userId) {
      if (excludeAnswered && userId) {
        baseWhere.answers = {
          none: {
            user_id: userId,
          },
        };
      }

      return this.shuffleAndTake(await this.findQuestions(baseWhere), limitNum);
    }

    const unansweredQuestions = await this.findQuestions({
      ...baseWhere,
      answers: {
        none: {
          user_id: userId,
        },
      },
    });

    let result = [...unansweredQuestions];

    if (result.length < limitNum) {
      const answeredQuestions = await this.findQuestions(
        this.buildAnsweredWhere(baseWhere, userId, retrieveWrong),
      );

      result = result.concat(this.shuffleAndTake(answeredQuestions, limitNum - result.length));
    }

    return this.shuffleAndTake(result, limitNum);
  }

  async countByPathAndType(pathId: string, type: string): Promise<number> {
    return this.prisma.question.count({
      where: {
        path_id: pathId,
        origin: this.getOrigin(type),
      },
    });
  }

  async findQuestionById(id: string): Promise<QuestionWithAlternatives | null> {
    return this.prisma.question.findUnique({
      where: { id },
      include: {
        alternatives: true,
      },
    });
  }

  async countAnsweredByUserInPath(userId: string, pathId: string, type: string): Promise<number> {
    return this.prisma.answer.count({
      where: {
        user_id: userId,
        question: {
          path_id: pathId,
          origin: this.getOrigin(type),
        },
      },
    });
  }

  async pathExists(pathId: string): Promise<boolean> {
    const path = await this.prisma.path.findUnique({
      where: { id: pathId },
    });
    return !!path;
  }

  private getOrigin(type: string): 'EXTERNAL' | 'ORIGINAL' {
    return type === 'SIMPLIFIED' ? 'EXTERNAL' : 'ORIGINAL';
  }

  private getQuestionInclude() {
    return {
      path: {
        include: {
          subject: true,
        },
      },
      alternatives: {
        select: {
          id: true,
          text: true,
          letter: true,
          is_correct: true,
        },
      },
    };
  }

  private async findQuestions(where: any): Promise<QuestionResponse[]> {
    const questions = await this.prisma.question.findMany({
      where,
      include: this.getQuestionInclude(),
    });

    return questions.map((question) => this.mapQuestion(question));
  }

  private mapQuestion(question: any): QuestionResponse {
    return {
      id: question.id,
      text: question.text,
      media_key: question.media_key,
      origin: question.origin,
      subjectName: question.path.subject.name,
      topicName: question.path.name,
      alternatives: question.alternatives,
    };
  }

  private buildAnsweredWhere(baseWhere: any, userId: string, retrieveWrong: boolean): any {
    const answeredWhere = {
      ...baseWhere,
      answers: {
        some: {
          user_id: userId,
        },
      },
    };

    if (!retrieveWrong) {
      answeredWhere.answers.some.alternative = {
        is_correct: true,
      };
    }

    return answeredWhere;
  }

  private shuffleAndTake<T>(items: T[], limit: number): T[] {
    return items.sort(() => Math.random() - 0.5).slice(0, limit);
  }
  async createAnswer(data: Prisma.AnswerUncheckedCreateInput): Promise<Answer> {
    return this.prisma.answer.create({
      data,
    });
  }

  async findAttemptByIdAndUser(attemptId: string, userId: string) {
    return this.prisma.attempt.findFirst({
      where: { id: attemptId, user_id: userId },
    });
  }

  async findAttemptDay(attemptId: string, examDayId: string) {
    return this.prisma.attemptDay.findFirst({
      where: { attempt_id: attemptId, exam_day_id: examDayId },
    });
  }

  async createAttemptDay(data: Prisma.AttemptDayUncheckedCreateInput) {
    return this.prisma.attemptDay.create({ data });
  }

  async findExistingAnswer(attemptDayId: string, questionId: string) {
    return this.prisma.answer.findFirst({
      where: { attempt_day_id: attemptDayId, question_id: questionId },
    });
  }

  async updateAnswerAlternative(answerId: string, alternativeId: string) {
    return this.prisma.answer.update({
      where: { id: answerId },
      data: { alternative_id: alternativeId, answer_date: new Date() },
    });
  }

  async updateAttemptProgress(
    attemptId: string,
    timeSpentSeconds: number,
    currentQuestion: number,
  ) {
    return this.prisma.attempt.update({
      where: { id: attemptId },
      data: { time_spent_seconds: timeSpentSeconds, current_question: currentQuestion },
    });
  }
}
