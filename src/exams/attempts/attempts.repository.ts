import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AttemptsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AttemptUncheckedCreateInput) {
    return this.prisma.attempt.create({ data });
  }

  async findActive(userId: string, examId: string) {
    return this.prisma.attempt.findFirst({
      where: { user_id: userId, exam_id: examId, end_time: null },
    });
  }

  async findByIdAndUser(id: string, userId: string) {
    return this.prisma.attempt.findFirst({
      where: { id, user_id: userId },
    });
  }

  async update(id: string, data: Prisma.AttemptUpdateInput) {
    return this.prisma.attempt.update({
      where: { id },
      data,
    });
  }

  async findLastWithQuestions(userId: string, examId: string, examDayId?: string) {
    return this.prisma.attempt.findFirst({
      where: { user_id: userId, exam_id: examId, end_time: null },
      orderBy: { init_time: 'desc' },
      include: {
        exam: {
          include: {
            exam_days: {
              where: examDayId ? { id: examDayId } : undefined,
              include: { questions: { include: { alternatives: true } } },
            },
          },
        },
      },
    });
  }

  async findAnswersByAttemptId(attemptId: string) {
    return this.prisma.answer.findMany({
      where: { attempt_day: { attempt_id: attemptId } },
    });
  }

  async findAttemptDay(attemptId: string, examDayId: string) {
    return this.prisma.attemptDay.findUnique({
      where: { attempt_id_exam_day_id: { attempt_id: attemptId, exam_day_id: examDayId } },
    });
  }

  async countFinishedAttemptDays(attemptId: string) {
    return this.prisma.attemptDay.count({
      where: { attempt_id: attemptId, end_time: { not: null } },
    });
  }

  async finishAttemptDay(attemptDayId: string, timeSpentSeconds?: number) {
    return this.prisma.attemptDay.update({
      where: { id: attemptDayId },
      data: {
        end_time: new Date(),
        ...(timeSpentSeconds !== undefined ? { time_spent_seconds: timeSpentSeconds } : {}),
      },
    });
  }

  async findAttemptForFinish(id: string, userId: string) {
    return this.prisma.attempt.findFirst({
      where: { id, user_id: userId },
      include: {
        exam: {
          include: {
            exam_days: {
              include: {
                questions: {
                  include: {
                    alternatives: { where: { is_correct: true } },
                    path: { include: { subject: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
