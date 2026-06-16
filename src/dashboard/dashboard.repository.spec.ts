import { ExamStatus, PlanType } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { DashboardRepository } from './dashboard.repository';

describe('DashboardRepository', () => {
  const prisma = {
    user: { count: jest.fn() },
    exam: { count: jest.fn() },
    question: { count: jest.fn() },
    subscription: { findMany: jest.fn() },
    attempt: { aggregate: jest.fn(), findMany: jest.fn() },
    subject: { findMany: jest.fn() },
  };

  let repo: DashboardRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new DashboardRepository(prisma as unknown as PrismaService);
  });

  it('getUserCounts aggregates active, inactive and newThisMonth', async () => {
    prisma.user.count.mockResolvedValueOnce(10).mockResolvedValueOnce(2).mockResolvedValueOnce(3);

    const result = await repo.getUserCounts();

    expect(result).toEqual({ active: 10, inactive: 2, newThisMonth: 3 });
    expect(prisma.user.count).toHaveBeenNthCalledWith(1, { where: { enable: true } });
    expect(prisma.user.count).toHaveBeenNthCalledWith(2, { where: { enable: false } });
  });

  it('getTotalUsers delegates to prisma.user.count', async () => {
    prisma.user.count.mockResolvedValue(42);
    await expect(repo.getTotalUsers()).resolves.toBe(42);
    expect(prisma.user.count).toHaveBeenCalledWith();
  });

  it('getExamCounts aggregates total, published, draft and archived', async () => {
    prisma.exam.count
      .mockResolvedValueOnce(14)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0);

    const result = await repo.getExamCounts();

    expect(result).toEqual({ total: 14, published: 12, draft: 2, archived: 0 });
    expect(prisma.exam.count).toHaveBeenNthCalledWith(2, {
      where: { status: ExamStatus.PUBLISHED },
    });
  });

  it('getQuestionsTotal counts only enabled questions', async () => {
    prisma.question.count.mockResolvedValue(152);
    await expect(repo.getQuestionsTotal()).resolves.toBe(152);
    expect(prisma.question.count).toHaveBeenCalledWith({ where: { enable: true } });
  });

  it('getEngagementCounts aggregates last7Days and last30Days', async () => {
    prisma.user.count.mockResolvedValueOnce(80).mockResolvedValueOnce(200);

    const result = await repo.getEngagementCounts();

    expect(result).toEqual({ last7Days: 80, last30Days: 200 });
  });

  it('getDistinctActiveSubscribers deduplicates by user_id keeping most recent', async () => {
    prisma.subscription.findMany.mockResolvedValue([
      { user_id: 'u1', plan_type: PlanType.ANUAL },
      { user_id: 'u1', plan_type: PlanType.TRIMESTRAL },
      { user_id: 'u2', plan_type: PlanType.TRIMESTRAL },
    ]);

    const result = await repo.getDistinctActiveSubscribers();

    expect(result).toEqual([
      { user_id: 'u1', plan_type: PlanType.ANUAL },
      { user_id: 'u2', plan_type: PlanType.TRIMESTRAL },
    ]);
  });

  it('getDistinctActiveSubscribers returns empty array when no subscriptions', async () => {
    prisma.subscription.findMany.mockResolvedValue([]);
    await expect(repo.getDistinctActiveSubscribers()).resolves.toEqual([]);
  });

  it('getExamUsageAverage rounds the average time spent', async () => {
    prisma.attempt.aggregate.mockResolvedValue({ _avg: { time_spent_seconds: 124.6 } });
    await expect(repo.getExamUsageAverage()).resolves.toBe(125);
  });

  it('getExamUsageAverage returns 0 when there is no data', async () => {
    prisma.attempt.aggregate.mockResolvedValue({ _avg: { time_spent_seconds: null } });
    await expect(repo.getExamUsageAverage()).resolves.toBe(0);
  });

  it('getFinishedAttemptsSince delegates to prisma.attempt.findMany', async () => {
    const since = new Date('2026-01-01');
    prisma.attempt.findMany.mockResolvedValue([]);

    await repo.getFinishedAttemptsSince(since);

    expect(prisma.attempt.findMany).toHaveBeenCalledWith({
      where: { end_time: { not: null }, init_time: { gte: since } },
      select: { init_time: true, time_spent_seconds: true },
    });
  });

  it('getSubjectStats aggregates question/answer counts and last updated date', async () => {
    const oldDate = new Date('2026-01-01');
    const newDate = new Date('2026-02-01');
    prisma.subject.findMany.mockResolvedValue([
      {
        name: 'Química',
        paths: [
          {
            questions: [
              { updatedAt: oldDate, _count: { answers: 3 } },
              { updatedAt: newDate, _count: { answers: 2 } },
            ],
          },
        ],
      },
    ]);

    const result = await repo.getSubjectStats();

    expect(result).toEqual([
      {
        subject: 'Química',
        questionCount: 2,
        answerCount: 5,
        lastUpdated: newDate.toISOString(),
      },
    ]);
  });

  it('getSubjectStats handles subjects without questions', async () => {
    prisma.subject.findMany.mockResolvedValue([{ name: 'Vazia', paths: [] }]);

    const result = await repo.getSubjectStats();

    expect(result).toEqual([
      { subject: 'Vazia', questionCount: 0, answerCount: 0, lastUpdated: null },
    ]);
  });
});
