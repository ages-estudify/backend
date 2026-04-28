import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
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

  async findLastWithQuestions(userId: string, examId: string) {
    return this.prisma.attempt.findFirst({
      where: { user_id: userId, exam_id: examId, end_time: null },
      orderBy: { init_time: 'desc' },
      include: {
        exam: {
          include: {
            exam_days: {
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
