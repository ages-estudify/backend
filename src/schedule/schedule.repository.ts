import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboarding_completed: true },
    });
  }

  async findStudyDaysByUser(userId: string) {
    return this.prisma.studyDay.findMany({
      where: { user_id: userId },
      select: { day: true, hour: true },
    });
  }

  async userHasStudyLogs(userId: string) {
    const count = await this.prisma.studyLog.count({ where: { user_id: userId } });
    return count > 0;
  }

  async getStudyLogBounds(userId: string) {
    const first = await this.prisma.studyLog.findFirst({
      where: { user_id: userId },
      orderBy: { date: 'asc' },
      select: { date: true },
    });
    const last = await this.prisma.studyLog.findFirst({
      where: { user_id: userId },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    return {
      firstDate: first ? first.date.toISOString().slice(0, 10) : this.formatDateOnly(new Date()),
      lastDate: last ? last.date.toISOString().slice(0, 10) : this.formatDateOnly(new Date()),
    };
  }

  async findPathsOrdered() {
    return this.prisma.path.findMany({
      orderBy: { schedule_position: 'asc' },
      select: { id: true },
    });
  }

  async createStudyLogs(
    entries: Array<{ date: Date; path_id: string; user_id: string; done: boolean }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.studyLog.createMany({ data: entries });
    });
  }

  async findStudyLogsByRange(userId: string, startDate: Date, endDate: Date) {
    return this.prisma.studyLog.findMany({
      where: {
        user_id: userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        path: {
          include: {
            subject: true,
          },
        },
      },
    });
  }

  async findStudyLogByIdAndUser(itemId: string, userId: string) {
    return this.prisma.studyLog.findFirst({
      where: {
        id: itemId,
        user_id: userId,
      },
    });
  }

  async updateStudyLogDone(itemId: string, done: boolean) {
    return this.prisma.studyLog.update({
      where: { id: itemId },
      data: { done },
    });
  }

  private formatDateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
