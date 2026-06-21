import { Injectable } from '@nestjs/common';
import { PlanType } from '@prisma/client';
import { DashboardRepository } from './dashboard.repository';
import { DashboardResponseDto, ExamUsageWeekDto } from './dto/dashboard-response.dto';

const EXAM_USAGE_WEEKS = 8;

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async getDashboard(): Promise<DashboardResponseDto> {
    const [
      userCounts,
      totalUsers,
      examCounts,
      questionsTotal,
      engagementCounts,
      activeSubscribers,
      examUsageAverage,
      subjects,
    ] = await Promise.all([
      this.repository.getUserCounts(),
      this.repository.getTotalUsers(),
      this.repository.getExamCounts(),
      this.repository.getQuestionsTotal(),
      this.repository.getEngagementCounts(),
      this.repository.getDistinctActiveSubscribers(),
      this.repository.getExamUsageAverage(),
      this.repository.getSubjectStats(),
    ]);

    const currentWeekStart = this.getWeekStart(new Date());
    const earliestWeekStart = new Date(currentWeekStart);
    earliestWeekStart.setDate(earliestWeekStart.getDate() - (EXAM_USAGE_WEEKS - 1) * 7);
    const attempts = await this.repository.getFinishedAttemptsSince(earliestWeekStart);

    return {
      success: true,
      data: {
        users: userCounts,
        exams: examCounts,
        questions: { total: questionsTotal },
        engagement: {
          totalUsers,
          last7Days: {
            count: engagementCounts.last7Days,
            percentage: this.percentage(engagementCounts.last7Days, totalUsers),
          },
          last30Days: {
            count: engagementCounts.last30Days,
            percentage: this.percentage(engagementCounts.last30Days, totalUsers),
          },
        },
        plans: this.buildPlanStats(activeSubscribers, totalUsers),
        examUsage: {
          averageTimeSeconds: examUsageAverage,
          series: this.buildExamUsageSeries(attempts, earliestWeekStart),
        },
        subjects: [...subjects].sort((a, b) => b.questionCount - a.questionCount),
      },
    };
  }

  private percentage(count: number, total: number): number {
    return total === 0 ? 0 : Math.round((count / total) * 100);
  }

  private getWeekStart(date: Date): Date {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOfWeek = result.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    result.setDate(result.getDate() + diffToMonday);
    return result;
  }

  private buildPlanStats(
    activeSubscribers: { user_id: string; plan_type: PlanType }[],
    totalUsers: number,
  ) {
    const trimestralCount = activeSubscribers.filter(
      (s) => s.plan_type === PlanType.TRIMESTRAL,
    ).length;
    const anualCount = activeSubscribers.filter((s) => s.plan_type === PlanType.ANUAL).length;
    const noneCount = totalUsers - activeSubscribers.length;

    return {
      trimestral: {
        count: trimestralCount,
        percentage: this.percentage(trimestralCount, totalUsers),
      },
      anual: { count: anualCount, percentage: this.percentage(anualCount, totalUsers) },
      none: { count: noneCount, percentage: this.percentage(noneCount, totalUsers) },
    };
  }

  private buildExamUsageSeries(
    attempts: { init_time: Date; time_spent_seconds: number }[],
    since: Date,
  ): ExamUsageWeekDto[] {
    const weekStarts: Date[] = [];
    for (let i = 0; i < EXAM_USAGE_WEEKS; i++) {
      const weekStart = new Date(since);
      weekStart.setDate(since.getDate() + i * 7);
      weekStarts.push(weekStart);
    }

    return weekStarts.map((weekStart, index) => {
      const weekEnd = weekStarts[index + 1] ?? new Date();
      const weekAttempts = attempts.filter(
        (a) => a.init_time >= weekStart && a.init_time < weekEnd,
      );
      const averageTimeSeconds = weekAttempts.length
        ? Math.round(
            weekAttempts.reduce((sum, a) => sum + a.time_spent_seconds, 0) / weekAttempts.length,
          )
        : 0;
      return {
        weekStart: this.formatDate(weekStart),
        averageTimeSeconds,
      };
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
