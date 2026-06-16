import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: jest.Mocked<Pick<DashboardService, 'getDashboard'>>;

  beforeEach(async () => {
    service = { getDashboard: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getDashboard delegates to dashboard service', async () => {
    const response: DashboardResponseDto = {
      success: true,
      data: {
        users: { active: 1, inactive: 0, newThisMonth: 1 },
        exams: { total: 1, published: 1, draft: 0, archived: 0 },
        questions: { total: 1 },
        engagement: {
          totalUsers: 1,
          last7Days: { count: 1, percentage: 100 },
          last30Days: { count: 1, percentage: 100 },
        },
        plans: {
          trimestral: { count: 0, percentage: 0 },
          anual: { count: 0, percentage: 0 },
          none: { count: 1, percentage: 100 },
        },
        examUsage: { averageTimeSeconds: 0, series: [] },
        subjects: [],
      },
    };
    service.getDashboard.mockResolvedValue(response);

    await expect(controller.getDashboard()).resolves.toEqual(response);
    expect(service.getDashboard).toHaveBeenCalledWith();
  });
});
