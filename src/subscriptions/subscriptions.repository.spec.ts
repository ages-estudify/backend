import { Test, TestingModule } from '@nestjs/testing';
import { PlanType, Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { SubscriptionsRepository } from './subscriptions.repository';

describe('SubscriptionsRepository', () => {
  let repository: SubscriptionsRepository;
  let txClient: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    subscription: { create: jest.Mock };
  };
  let prisma: { $transaction: jest.Mock };

  beforeEach(async () => {
    txClient = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      subscription: { create: jest.fn() },
    };
    prisma = {
      $transaction: jest.fn((callback: (tx: typeof txClient) => Promise<unknown>) =>
        callback(txClient),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionsRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get<SubscriptionsRepository>(SubscriptionsRepository);
  });

  it('creates the subscription and updates the user inside a transaction', async () => {
    const startDate = new Date('2026-04-15T12:00:00.000Z');
    const endDate = new Date('2026-07-15T12:00:00.000Z');
    const updatedUser = { id: 'u1', role: Role.USER, plan_end_date: endDate };

    txClient.user.findUnique.mockResolvedValue({ id: 'u1' });
    txClient.subscription.create.mockResolvedValue({ id: 'sub1' });
    txClient.user.update.mockResolvedValue(updatedUser);

    const result = await repository.createWithUserUpdate({
      userId: 'u1',
      planType: PlanType.TRIMESTRAL,
      startDate,
      endDate,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(txClient.subscription.create).toHaveBeenCalledWith({
      data: {
        user_id: 'u1',
        plan_type: PlanType.TRIMESTRAL,
        start_date: startDate,
        end_date: endDate,
      },
    });
    expect(txClient.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { plan_end_date: endDate },
      select: { id: true, role: true, plan_end_date: true },
    });
    expect(result).toEqual(updatedUser);
  });

  it('returns null and skips writes when user does not exist', async () => {
    txClient.user.findUnique.mockResolvedValue(null);

    const result = await repository.createWithUserUpdate({
      userId: 'missing',
      planType: PlanType.ANUAL,
      startDate: new Date(),
      endDate: new Date(),
    });

    expect(result).toBeNull();
    expect(txClient.subscription.create).not.toHaveBeenCalled();
    expect(txClient.user.update).not.toHaveBeenCalled();
  });

  it('propagates errors so the transaction rolls back', async () => {
    txClient.user.findUnique.mockResolvedValue({ id: 'u1' });
    txClient.subscription.create.mockRejectedValue(new Error('db error'));

    await expect(
      repository.createWithUserUpdate({
        userId: 'u1',
        planType: PlanType.TRIMESTRAL,
        startDate: new Date(),
        endDate: new Date(),
      }),
    ).rejects.toThrow('db error');
    expect(txClient.user.update).not.toHaveBeenCalled();
  });
});
