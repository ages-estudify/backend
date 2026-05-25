import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { StreakDataDto } from './dto/streak-response.dto';

const TIME_ZONE = 'America/Sao_Paulo';

@Injectable()
export class StreakService {
  constructor(private readonly users: UsersRepository) {}

  async registerAnswer(userId: string): Promise<StreakDataDto> {
    const user = await this.users.findUniqueById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const today = this.startOfDay(new Date());
    const lastActive = user.last_active ? this.startOfDay(user.last_active) : null;
    const currentStreak = user.streak ?? 0;

    if (lastActive === null) {
      await this.users.updateStreak(userId, { streak: 1, last_active: today });
      return { streakDays: 1, streakActive: true };
    }

    const gapDays = this.daysBetween(lastActive, today);

    if (gapDays === 0) {
      return { streakDays: currentStreak, streakActive: true };
    }

    if (gapDays === 1) {
      const newStreak = currentStreak + 1;
      await this.users.updateStreak(userId, { streak: newStreak, last_active: today });
      return { streakDays: newStreak, streakActive: true };
    }

    await this.users.updateStreak(userId, { streak: 0, last_active: today });
    return { streakDays: 0, streakActive: false };
  }

  async getStreak(userId: string): Promise<StreakDataDto> {
    const user = await this.users.findUniqueById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const today = this.startOfDay(new Date());
    const lastActive = user.last_active ? this.startOfDay(user.last_active) : null;
    const currentStreak = user.streak ?? 0;

    if (lastActive === null) {
      return { streakDays: 0, streakActive: false };
    }

    const gapDays = this.daysBetween(lastActive, today);

    if (gapDays === 0) {
      return { streakDays: currentStreak, streakActive: true };
    }

    if (gapDays === 1) {
      return { streakDays: currentStreak, streakActive: false };
    }

    await this.users.updateStreak(userId, { streak: 0 });
    return { streakDays: 0, streakActive: false };
  }

  private startOfDay(date: Date): Date {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const year = Number(parts.find((p) => p.type === 'year')!.value);
    const month = Number(parts.find((p) => p.type === 'month')!.value);
    const day = Number(parts.find((p) => p.type === 'day')!.value);
    return new Date(Date.UTC(year, month - 1, day));
  }

  private daysBetween(from: Date, to: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((to.getTime() - from.getTime()) / msPerDay);
  }
}
