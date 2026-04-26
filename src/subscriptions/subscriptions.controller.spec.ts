import { Test, TestingModule } from '@nestjs/testing';
import { PlanType, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let service: jest.Mocked<Pick<SubscriptionsService, 'activatePlan'>>;

  beforeEach(async () => {
    service = { activatePlan: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [{ provide: SubscriptionsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
  });

  it('delegates to service using userId from JWT and wraps the response', async () => {
    const viewer: JwtAuthUser = {
      userId: 'u1',
      role: Role.USER,
      planExpirationDate: null,
    };
    const data = {
      planActive: true,
      planExpirationDate: '2026-07-15',
      token: 'jwt',
      refreshToken: 'refresh',
    };
    service.activatePlan.mockResolvedValue(data);

    const result = await controller.create(viewer, { planType: PlanType.TRIMESTRAL });

    expect(service.activatePlan).toHaveBeenCalledWith('u1', PlanType.TRIMESTRAL);
    expect(result).toEqual({ success: true, data });
  });
});
