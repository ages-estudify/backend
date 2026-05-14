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
      },
      orderBy: {
        init_time: 'desc',
      },
      take: quant, select: {
        id: true,
        init_time: true,
        exam: true,
        attempt_days: true

      }
    })

    console.log(lastAttempts)

    return lastAttempts
  }




}
