import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

import { SubscriptionGuard } from './subscription.guard';

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const createContext = (user: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();

    guard = new SubscriptionGuard(prismaMock as any);
  });

  it('should allow ADM users even without plan', async () => {
    const context = createContext({
      userId: '1',
      role: Role.ADM,
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('should allow users with active plan', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      enable: true,
      plan_end_date: new Date(Date.now() + 100000),
    });

    const context = createContext({
      userId: '1',
      role: Role.USER,
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny users with expired plan', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      enable: true,
      plan_end_date: new Date(Date.now() - 100000),
    });

    const context = createContext({
      userId: '1',
      role: Role.USER,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should deny users without plan', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      enable: true,
      plan_end_date: null,
    });

    const context = createContext({
      userId: '1',
      role: Role.USER,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should deny disabled users', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      enable: false,
      plan_end_date: new Date(Date.now() + 100000),
    });

    const context = createContext({
      userId: '1',
      role: Role.USER,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
