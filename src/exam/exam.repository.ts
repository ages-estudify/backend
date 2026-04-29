import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export const ATTEMPT_RESULT_GRID_INCLUDE = {
  attempt_days: {
    include: {
      exam_day: {
        select: {
          day: true,
        },
      },
      answers: {
        include: {
          question: {
            include: {
              alternatives: {
                select: {
                  letter: true,
                  is_correct: true,
                },
              },
            },
          },
          alternative: {
            select: {
              letter: true,
            },
          },
        },
      },
    },
  },
} as const;

@Injectable()
export class ExamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAttemptResultGridById(attemptId: string, userId: string) {
    return this.prisma.attempt.findFirst({
      where: {
        id: attemptId,
        user_id: userId,
      },
      include: ATTEMPT_RESULT_GRID_INCLUDE,
    });
  }
}
