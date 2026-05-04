import { Injectable, NotFoundException } from '@nestjs/common';
import { PlanType } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { SubscriptionsRepository } from './subscriptions.repository';

export type ActivatePlanResult = {
  planActive: boolean;
  planExpirationDate: string | null;
  token: string;
  refreshToken: string;
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly repository: SubscriptionsRepository,
    private readonly authService: AuthService,
  ) {}

  async activatePlan(userId: string, planType: PlanType): Promise<ActivatePlanResult> {
    const startDate = new Date();
    const endDate = this.computeEndDate(startDate, planType);

    const updatedUser = await this.repository.createWithUserUpdate({
      userId,
      planType,
      startDate,
      endDate,
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    const session = await this.authService.buildAuthSession(updatedUser);

    return {
      planActive: true,
      planExpirationDate: session.planExpirationDate,
      token: session.token,
      refreshToken: session.refreshToken,
    };
  }

  private computeEndDate(start: Date, planType: PlanType): Date {
    const end = new Date(start);
    const monthsToAdd = planType === PlanType.ANUAL ? 12 : 3;
    end.setMonth(end.getMonth() + monthsToAdd);
    return end;
  }
}
