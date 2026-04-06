import { Injectable } from '@nestjs/common';
import { Prisma, Question, Answer } from '@prisma/client';
import { PrismaService } from '../prisma.service';

export type QuestionWithAlternatives = Question & {
  alternatives: Prisma.AlternativeGetPayload<true>[];
};

@Injectable()
export class QuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findQuestionById(id: string): Promise<QuestionWithAlternatives | null> {
    return this.prisma.question.findUnique({
      where: { id },
      include: {
        alternatives: true,
      },
    });
  }

  async createAnswer(data: Prisma.AnswerUncheckedCreateInput): Promise<Answer> {
    return this.prisma.answer.create({
      data,
    });
  }
}
