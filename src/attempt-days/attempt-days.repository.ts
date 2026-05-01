import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

const attemptDayResultInclude = {
  attempt: { include: { exam: true } },
  exam_day: true,
  answers: { include: { alternative: true } },
} satisfies Prisma.AttemptDayInclude;

export type AttemptDayForResult = Prisma.AttemptDayGetPayload<{
  include: typeof attemptDayResultInclude;
}>;

export type QuestionWithAlternativesForExamDay = Prisma.QuestionGetPayload<{
  include: { alternatives: true };
}>;

@Injectable()
export class AttemptDaysRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAttemptDayForUserResult(
    attemptDayId: string,
    userId: string,
  ): Promise<AttemptDayForResult | null> {
    return this.prisma.attemptDay.findFirst({
      where: {
        id: attemptDayId,
        attempt: { user_id: userId },
      },
      include: attemptDayResultInclude,
    });
  }

  findQuestionsByExamDayId(examDayId: string): Promise<QuestionWithAlternativesForExamDay[]> {
    return this.prisma.question.findMany({
      where: { exam_day_id: examDayId },
      include: { alternatives: true },
      orderBy: [{ number: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
    });
  }
}
