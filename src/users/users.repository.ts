import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  AccuracyBySubjectDto,
  CompletedTopicsDto,
  OverviewDto,
  SimuladoDto,
} from './dto/user-stats.dto';

export type UserResponse = Omit<User, 'password'>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone_number: phone },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findMany(): Promise<UserResponse[]> {
    return this.prisma.user.findMany({ omit: { password: true } });
  }

  async findUniqueById(id: string): Promise<UserResponse | null> {
    return this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });
  }

  async incrementCoins(id: string, amount: number): Promise<{ coins: number | null }> {
    await this.prisma.user.updateMany({
      where: { id, coins: null },
      data: { coins: 0 },
    });
    return this.prisma.user.update({
      where: { id },
      data: { coins: { increment: amount } },
      select: { coins: true },
    });
  }

  async getAnswerOverviewByUser(id: string): Promise<OverviewDto> {
    const [correctAnswer, total] = await Promise.all([
      this.prisma.answer.count({
        where: {
          user_id: id,
          attempt_day_id: null,
          alternative: {
            is: {
              is_correct: true,
            },
          },
        },
      }),

      this.prisma.answer.count({
        where: {
          user_id: id,
          attempt_day_id: null,
        },
      }),
    ]);
    const percentage = Number(((correctAnswer / Math.max(total, 1)) * 100).toFixed(1));

    return { totalAnswered: total, totalCorrect: correctAnswer, accuracyPercentage: percentage };
  }

  async getCompletedTopicsByUser(id: string): Promise<CompletedTopicsDto> {
    const [answers, questions] = await Promise.all([
      this.prisma.answer.findMany({
        where: {
          user_id: id,
          attempt_day_id: null,
        },
        select: {
          question: {
            select: {
              path: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.question.findMany({
        where: {
          exam_day_id: null,
        },
        select: {
          path: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    const stats: Record<string, { answered: number; total: number }> = {};

    for (const q of questions) {
      const topic = q.path.name;

      stats[topic] ??= { answered: 0, total: 0 };
      stats[topic].total++;
    }

    for (const a of answers) {
      const topic = a.question.path.name;

      stats[topic] ??= { answered: 0, total: 0 };
      stats[topic].answered++;
    }

    const values = Object.values(stats);

    const completed = values.filter((s) => s.answered === s.total).length;

    return {
      completed,
      total: values.length,
    };
  }

  async getSubjectStatsByUser(id: string): Promise<AccuracyBySubjectDto[]> {
    const answers = await this.prisma.answer.findMany({
      where: {
        user_id: id,
        attempt_day_id: null,
      },

      select: {
        alternative: {
          select: {
            is_correct: true,
          },
        },

        question: {
          select: {
            path: {
              select: {
                subject: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    const stats: Record<
      string,
      {
        id: string;
        name: string;
        correct: number;
        total: number;
      }
    > = {};

    for (const a of answers) {
      const subject = a.question.path.subject;

      stats[subject.id] ??= {
        id: subject.id,
        name: subject.name,
        correct: 0,
        total: 0,
      };

      stats[subject.id].total++;

      if (a.alternative?.is_correct) {
        stats[subject.id].correct++;
      }
    }

    return Object.values(stats).map((subject) => ({
      subjectId: subject.id,
      subjectName: subject.name,
      correct: subject.correct,
      totalAnswered: subject.total,
    }));
  }

  async getStarsAndStreakByUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        streak: true,
        coins: true,
      },
    });
  }

  async getLastAttemptsByUser(id: string, quant: number): Promise<SimuladoDto[]> {
    const lastAttempts = await this.prisma.attempt.findMany({
      where: {
        user_id: id,
        end_time: {
          not: null,
        },
      },

      orderBy: { end_time: 'desc' },

      take: quant,
      select: {
        id: true,
        end_time: true,
        exam: {
          select: {
            name: true,
          },
        },
        attempt_days: {
          select: {
            id: true,
            exam_day: { select: { day: true } },
            answers: { select: { alternative: { select: { is_correct: true } } } },
          },
        },
      },
    });

    const formatted = lastAttempts.map((attempt) => ({
      attemptId: attempt.id,

      examName: attempt.exam.name,

      date: attempt.end_time?.toISOString().split('T')[0] ?? null,

      days: attempt.attempt_days.map((day) => {
        const total = day.answers.length;

        const correct = day.answers.filter((answer) => answer.alternative?.is_correct).length;

        const scorePercentage = Number(((correct / total) * 100).toFixed(1));

        return {
          day: day.exam_day.day,

          label: `Dia ${day.exam_day.day}`,

          correct,

          total,

          scorePercentage,
        };
      }),
    }));

    return formatted;
  }

  async updateStreak(
    id: string,
    data: { streak?: number; last_active?: Date },
  ): Promise<{ streak: number | null; last_active: Date | null }> {
    return this.prisma.user.update({
      where: { id },
      data,
      select: { streak: true, last_active: true },
    });
  }
}
