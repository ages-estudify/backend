import { PlanType } from '@prisma/client';
import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let repository: jest.Mocked<DashboardRepository>;

  const defaultRepoResult = {
    userCounts: { active: 0, inactive: 0, newThisMonth: 0 },
    totalUsers: 0,
    examCounts: { total: 0, published: 0, draft: 0, archived: 0 },
    questionsTotal: 0,
    engagementCounts: { last7Days: 0, last30Days: 0 },
    activeSubscribers: [] as { user_id: string; plan_type: PlanType }[],
    examUsageAverage: 0,
    subjects: [] as {
      subject: string;
      questionCount: number;
      answerCount: number;
      lastUpdated: string | null;
    }[],
    attempts: [] as { init_time: Date; time_spent_seconds: number }[],
  };

  function mockRepository(overrides: Partial<typeof defaultRepoResult> = {}) {
    const data = { ...defaultRepoResult, ...overrides };
    repository.getUserCounts.mockResolvedValue(data.userCounts);
    repository.getTotalUsers.mockResolvedValue(data.totalUsers);
    repository.getExamCounts.mockResolvedValue(data.examCounts);
    repository.getQuestionsTotal.mockResolvedValue(data.questionsTotal);
    repository.getEngagementCounts.mockResolvedValue(data.engagementCounts);
    repository.getDistinctActiveSubscribers.mockResolvedValue(data.activeSubscribers);
    repository.getExamUsageAverage.mockResolvedValue(data.examUsageAverage);
    repository.getSubjectStats.mockResolvedValue(data.subjects);
    repository.getFinishedAttemptsSince.mockResolvedValue(data.attempts);
  }

  beforeEach(() => {
    repository = {
      getUserCounts: jest.fn(),
      getTotalUsers: jest.fn(),
      getExamCounts: jest.fn(),
      getQuestionsTotal: jest.fn(),
      getEngagementCounts: jest.fn(),
      getDistinctActiveSubscribers: jest.fn(),
      getExamUsageAverage: jest.fn(),
      getFinishedAttemptsSince: jest.fn(),
      getSubjectStats: jest.fn(),
    } as unknown as jest.Mocked<DashboardRepository>;
    service = new DashboardService(repository);
    jest.useFakeTimers().setSystemTime(new Date('2026-06-16T12:00:00.000Z')); // tuesday
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns zeroed percentages and empty series when the database is empty', async () => {
    mockRepository();

    const result = await service.getDashboard();

    expect(result.success).toBe(true);
    expect(result.data.users).toEqual({ active: 0, inactive: 0, newThisMonth: 0 });
    expect(result.data.engagement).toEqual({
      totalUsers: 0,
      last7Days: { count: 0, percentage: 0 },
      last30Days: { count: 0, percentage: 0 },
    });
    expect(result.data.plans).toEqual({
      trimestral: { count: 0, percentage: 0 },
      anual: { count: 0, percentage: 0 },
      none: { count: 0, percentage: 0 },
    });
    expect(result.data.examUsage.series).toHaveLength(8);
    expect(result.data.examUsage.series.every((w) => w.averageTimeSeconds === 0)).toBe(true);
    expect(result.data.subjects).toEqual([]);
  });

  it('computes engagement percentages relative to total users', async () => {
    mockRepository({
      totalUsers: 200,
      engagementCounts: { last7Days: 80, last30Days: 60 },
    });

    const result = await service.getDashboard();

    expect(result.data.engagement).toEqual({
      totalUsers: 200,
      last7Days: { count: 80, percentage: 40 },
      last30Days: { count: 60, percentage: 30 },
    });
  });

  it('computes plan stats from active subscribers, rounding percentages', async () => {
    mockRepository({
      totalUsers: 3,
      activeSubscribers: [
        { user_id: 'u1', plan_type: PlanType.TRIMESTRAL },
        { user_id: 'u2', plan_type: PlanType.ANUAL },
      ],
    });

    const result = await service.getDashboard();

    expect(result.data.plans).toEqual({
      trimestral: { count: 1, percentage: 33 },
      anual: { count: 1, percentage: 33 },
      none: { count: 1, percentage: 33 },
    });
  });

  it('sorts subjects by questionCount descending', async () => {
    mockRepository({
      subjects: [
        { subject: 'Biologia', questionCount: 5, answerCount: 10, lastUpdated: null },
        { subject: 'Química', questionCount: 92, answerCount: 1840, lastUpdated: null },
        { subject: 'Física', questionCount: 30, answerCount: 100, lastUpdated: null },
      ],
    });

    const result = await service.getDashboard();

    expect(result.data.subjects.map((s) => s.subject)).toEqual(['Química', 'Física', 'Biologia']);
  });

  it('groups finished attempts into the correct weekly buckets', async () => {
    mockRepository({
      examUsageAverage: 9480,
      attempts: [
        { init_time: new Date('2026-06-15T10:00:00.000Z'), time_spent_seconds: 100 },
        { init_time: new Date('2026-06-16T10:00:00.000Z'), time_spent_seconds: 300 },
        { init_time: new Date('2026-06-08T10:00:00.000Z'), time_spent_seconds: 50 },
      ],
    });

    const result = await service.getDashboard();

    expect(result.data.examUsage.averageTimeSeconds).toBe(9480);
    expect(result.data.examUsage.series).toHaveLength(8);

    const lastWeek = result.data.examUsage.series[result.data.examUsage.series.length - 1];
    const secondToLastWeek = result.data.examUsage.series[result.data.examUsage.series.length - 2];

    expect(lastWeek.weekStart).toBe('2026-06-15');
    expect(lastWeek.averageTimeSeconds).toBe(200); // average of 100 and 300
    expect(secondToLastWeek.weekStart).toBe('2026-06-08');
    expect(secondToLastWeek.averageTimeSeconds).toBe(50);
  });
});
