import { Injectable } from '@nestjs/common';
import { ExamStatus, PlanType } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUserCounts(): Promise<{ active: number; inactive: number; newThisMonth: number }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [active, inactive, newThisMonth] = await Promise.all([
      this.prisma.user.count({ where: { enable: true } }),
      this.prisma.user.count({ where: { enable: false } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);
    return { active, inactive, newThisMonth };
  }

  async getTotalUsers(): Promise<number> {
    return this.prisma.user.count();
  }

  async getExamCounts(): Promise<{
    total: number;
    published: number;
    draft: number;
    archived: number;
  }> {
    const [total, published, draft, archived] = await Promise.all([
      this.prisma.exam.count(),
      this.prisma.exam.count({ where: { status: ExamStatus.PUBLISHED } }),
      this.prisma.exam.count({ where: { status: ExamStatus.DRAFT } }),
      this.prisma.exam.count({ where: { status: ExamStatus.ARCHIVED } }),
    ]);
    return { total, published, draft, archived };
  }

  async getQuestionsTotal(): Promise<number> {
    return this.prisma.question.count({ where: { enable: true } });
  }

  async getEngagementCounts(): Promise<{ last7Days: number; last30Days: number }> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [last7Days, last30Days] = await Promise.all([
      this.prisma.user.count({ where: { last_active: { gte: sevenDaysAgo } } }),
      this.prisma.user.count({ where: { last_active: { gte: thirtyDaysAgo } } }),
    ]);
    return { last7Days, last30Days };
  }

  async getDistinctActiveSubscribers(): Promise<{ user_id: string; plan_type: PlanType }[]> {
    const now = new Date();
    const subs = await this.prisma.subscription.findMany({
      where: { end_date: { gte: now } },
      orderBy: { created_at: 'desc' },
      select: { user_id: true, plan_type: true },
    });
    const seen = new Set<string>();
    const result: { user_id: string; plan_type: PlanType }[] = [];
    for (const sub of subs) {
      if (!seen.has(sub.user_id)) {
        seen.add(sub.user_id);
        result.push(sub);
      }
    }
    return result;
  }

  async getExamUsageAverage(): Promise<number> {
    const result = await this.prisma.attempt.aggregate({
      where: { end_time: { not: null } },
      _avg: { time_spent_seconds: true },
    });
    return Math.round(result._avg.time_spent_seconds ?? 0);
  }

  async getFinishedAttemptsSince(
    since: Date,
  ): Promise<{ init_time: Date; time_spent_seconds: number }[]> {
    return this.prisma.attempt.findMany({
      where: { end_time: { not: null }, init_time: { gte: since } },
      select: { init_time: true, time_spent_seconds: true },
    });
  }

  async getSubjectStats(): Promise<
    { subject: string; questionCount: number; answerCount: number; lastUpdated: string | null }[]
  > {
    const subjects = await this.prisma.subject.findMany({
      select: {
        name: true,
        paths: {
          select: {
            questions: {
              where: { enable: true },
              select: {
                updatedAt: true,
                _count: { select: { answers: true } },
              },
            },
          },
        },
      },
    });

    return subjects.map((s) => {
      const questions = s.paths.flatMap((p) => p.questions);
      const questionCount = questions.length;
      const answerCount = questions.reduce((sum, q) => sum + q._count.answers, 0);
      const lastUpdated = questions.reduce<Date | null>((max, q) => {
        if (!max || q.updatedAt > max) return q.updatedAt;
        return max;
      }, null);
      return {
        subject: s.name,
        questionCount,
        answerCount,
        lastUpdated: lastUpdated?.toISOString() ?? null,
      };
    });
  }
}
