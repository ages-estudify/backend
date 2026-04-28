import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

import { SubscriptionGuard } from './subscription.guard';
import { JwtAuthUser } from '../security/jwt-auth-user';
import { PrismaService } from '../../prisma.service';

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const createContext = (user: JwtAuthUser): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();

    guard = new SubscriptionGuard(prismaMock as unknown as PrismaService);
  });

  it('should allow ADM users even without plan', async () => {
    const context = createContext({
      userId: '1',
      role: Role.ADM,
      planExpirationDate: null,
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
      planExpirationDate: null,
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
      planExpirationDate: null,
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
      planExpirationDate: null,
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
      planExpirationDate: null,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
