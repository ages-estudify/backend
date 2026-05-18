import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';

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

  async getQuestionsAnsweredByUser(id: string) {

    const correctAnswer = await this.prisma.answer.count({
      where: {
        user_id: id,
        attempt_day_id: null,
        alternative: {
          is: {
            is_correct: true,
          },
        },
      },
    })

    const total = await this.prisma.answer.count({
      where: {
        user_id: id,
        attempt_day_id: null,
      },
    })

    const p = ((correctAnswer / Math.max(total, 1)) * 100)
    const percentage = Number(p.toFixed(1))


    return { correctAnswer, total, percentage }

  }

  async getCompletedTopicsByUser(id: string) {
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
    ])

    const answerByTopic: Record<string, number> = {}
    const totalByTopic: Record<string, number> = {}

    for (const a of answers) {
      const topic = a.question.path.name
      answerByTopic[topic] = (answerByTopic[topic] ?? 0) + 1
    }

    for (const q of questions) {
      const topic = q.path.name
      totalByTopic[topic] = (totalByTopic[topic] ?? 0) + 1
    }

    let completedTopics = 0
    const topics = Object.keys(totalByTopic)

    for (const topic of topics) {
      if (totalByTopic[topic] === (answerByTopic[topic] ?? 0)) {
        completedTopics++
      }
    }

    return {
      completed: completedTopics,
      totalTopics: topics.length,
    }
  }

  async getSubjectStatsByUser(id: string) {

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
    })
    const correctBySubject: Record<string, number> = {}
    const totalBySubject: Record<string, number> = {}

    for (const a of answers) {
      const topic = a.question.path.subject.name

      totalBySubject[topic] = (totalBySubject[topic] ?? 0) + 1

      if (a.alternative?.is_correct) {
        correctBySubject[topic] = (correctBySubject[topic] ?? 0) + 1
      }


    }

    type Res = {
      id: string
      name: string
      correct: number
      total: number
    }


    const response: Res[] = []

    const subjects = new Map<string, { id: string; name: string }>()

    for (const a of answers) {
      const s = a.question.path.subject

      subjects.set(s.id, s)
    }

    for (const [id, subject] of subjects) {
      const correct = correctBySubject[subject.name] ?? 0
      const total = totalBySubject[subject.name] ?? 0

      if (total === 0) continue

      response.push({
        id,

        name: subject.name,

        correct,

        total,
      })
    }

    return response
  }

  async getStarsAndStreakByUser(id: string) {

    const starsStats = await this.prisma.user.findUnique({
      where: {
        id: id,
      }, select: {
        streak: true,
        coins: true,
      }
    })

    return starsStats

  }


  async getLastAttetpsByUser(id: string, quant: number) {

    const lastAttempts = await this.prisma.attempt.findMany({
      where: {
        user_id: id,
        end_time: {
          not: null
        }
      },

      orderBy: { end_time: 'desc', },

      take: quant, select: {
        id: true,
        end_time: true,
        exam: {
          select: {
            name: true

          }
        },
        attempt_days: {
          select: { id: true, exam_day: { select: { day: true } }, answers: { select: { alternative: { select: { is_correct: true } } } }, },
        },
      },
    })

    const formatted = lastAttempts.map(attempt => ({
      attemptId: attempt.id,

      examName: attempt.exam.name,

      date: attempt.end_time?.toISOString().split('T')[0] ?? null,

      days: attempt.attempt_days.map(day => {
        const total = day.answers.length

        const correct = day.answers.filter(
          answer => answer.alternative?.is_correct
        ).length

        const scorePercentage = Number(
          ((correct / total) * 100).toFixed(1)
        )

        return {
          day: day.exam_day.day,

          label: `Dia ${day.exam_day.day}`,

          correct,

          total,

          scorePercentage,
        }
      }),
    }))

    return formatted
  }




}
