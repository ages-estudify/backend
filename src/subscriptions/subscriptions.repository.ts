import { Injectable } from '@nestjs/common';
import { PlanType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithUserUpdate(params: {
    userId: string;
    planType: PlanType;
    startDate: Date;
    endDate: Date;
  }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const userExists = await tx.user.findUnique({ where: { id: params.userId } });
      if (!userExists) {
        return null;
      }

      await tx.subscription.create({
        data: {
          user_id: params.userId,
          plan_type: params.planType,
          start_date: params.startDate,
          end_date: params.endDate,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: params.userId },
        data: { plan_end_date: params.endDate },
        select: { id: true, role: true, plan_end_date: true },
      });

      return updatedUser;
    });
  }
}
