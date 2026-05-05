import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PlanType, Role } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { SubscriptionsRepository } from './subscriptions.repository';
import { SubscriptionsService } from './subscriptions.service';

type RepoMock = jest.Mocked<Pick<SubscriptionsRepository, 'createWithUserUpdate'>>;
type AuthMock = jest.Mocked<Pick<AuthService, 'buildAuthSession'>>;

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let repository: RepoMock;
  let authService: AuthMock;

  beforeEach(async () => {
    repository = { createWithUserUpdate: jest.fn() };
    authService = { buildAuthSession: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: SubscriptionsRepository, useValue: repository },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('computes end_date as start_date + 3 months for TRIMESTRAL', async () => {
    const fixedNow = new Date('2026-04-15T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(fixedNow);

    repository.createWithUserUpdate.mockResolvedValue({
      id: 'u1',
      role: Role.USER,
      plan_end_date: new Date('2026-07-15T12:00:00.000Z'),
    } as never);
    authService.buildAuthSession.mockResolvedValue({
      token: 't',
      refreshToken: 'r',
      role: Role.USER,
      planExpirationDate: '2026-07-15',
    });

    await service.activatePlan('u1', PlanType.TRIMESTRAL);

    expect(repository.createWithUserUpdate).toHaveBeenCalledWith({
      userId: 'u1',
      planType: PlanType.TRIMESTRAL,
      startDate: fixedNow,
      endDate: new Date('2026-07-15T12:00:00.000Z'),
    });

    jest.useRealTimers();
  });

  it('computes end_date as start_date + 12 months for ANUAL', async () => {
    const fixedNow = new Date('2026-04-15T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(fixedNow);

    repository.createWithUserUpdate.mockResolvedValue({
      id: 'u1',
      role: Role.USER,
      plan_end_date: new Date('2027-04-15T12:00:00.000Z'),
    } as never);
    authService.buildAuthSession.mockResolvedValue({
      token: 't',
      refreshToken: 'r',
      role: Role.USER,
      planExpirationDate: '2027-04-15',
    });

    await service.activatePlan('u1', PlanType.ANUAL);

    expect(repository.createWithUserUpdate).toHaveBeenCalledWith({
      userId: 'u1',
      planType: PlanType.ANUAL,
      startDate: fixedNow,
      endDate: new Date('2027-04-15T12:00:00.000Z'),
    });

    jest.useRealTimers();
  });

  it('returns reissued session with planExpirationDate from auth service', async () => {
    repository.createWithUserUpdate.mockResolvedValue({
      id: 'u1',
      role: Role.USER,
      plan_end_date: new Date('2026-07-15T12:00:00.000Z'),
    } as never);
    authService.buildAuthSession.mockResolvedValue({
      token: 'new-jwt',
      refreshToken: 'new-refresh',
      role: Role.USER,
      planExpirationDate: '2026-07-15',
    });

    const result = await service.activatePlan('u1', PlanType.TRIMESTRAL);

    expect(result).toEqual({
      planActive: true,
      planExpirationDate: '2026-07-15',
      token: 'new-jwt',
      refreshToken: 'new-refresh',
    });
    expect(authService.buildAuthSession).toHaveBeenCalledWith({
      id: 'u1',
      role: Role.USER,
      plan_end_date: new Date('2026-07-15T12:00:00.000Z'),
    });
  });

  it('throws NotFoundException when repository returns null (user does not exist)', async () => {
    repository.createWithUserUpdate.mockResolvedValue(null as never);

    await expect(service.activatePlan('missing', PlanType.TRIMESTRAL)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(authService.buildAuthSession).not.toHaveBeenCalled();
  });

  it('does not reissue token when transaction fails', async () => {
    repository.createWithUserUpdate.mockRejectedValue(new Error('tx failed'));

    await expect(service.activatePlan('u1', PlanType.ANUAL)).rejects.toThrow('tx failed');
    expect(authService.buildAuthSession).not.toHaveBeenCalled();
  });
});
