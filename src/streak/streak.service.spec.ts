import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../users/users.repository';
import { StreakService } from './streak.service';

describe('StreakService', () => {
  let service: StreakService;
  let users: { findUniqueById: jest.Mock; updateStreak: jest.Mock };

  const userId = '11111111-1111-1111-1111-111111111111';
  const fixedNow = new Date(2026, 5, 15, 12, 34, 56);
  const todayStart = new Date(2026, 5, 15);
  const yesterdayStart = new Date(2026, 5, 14);
  const twoDaysAgoStart = new Date(2026, 5, 13);

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    users = {
      findUniqueById: jest.fn(),
      updateStreak: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [StreakService, { provide: UsersRepository, useValue: users }],
    }).compile();

    service = module.get<StreakService>(StreakService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerAnswer', () => {
    it('throws NotFoundException when user does not exist', async () => {
      users.findUniqueById.mockResolvedValue(null);

      await expect(service.registerAnswer(userId)).rejects.toBeInstanceOf(NotFoundException);
      expect(users.updateStreak).not.toHaveBeenCalled();
    });

    it('first answer (lastActive null) sets streak to 1 and active', async () => {
      users.findUniqueById.mockResolvedValue({ id: userId, streak: null, last_active: null });

      const result = await service.registerAnswer(userId);

      expect(result).toEqual({ streakDays: 1, streakActive: true });
      expect(users.updateStreak).toHaveBeenCalledWith(userId, {
        streak: 1,
        last_active: todayStart,
      });
    });

    it('lastActive = today keeps streak unchanged and active', async () => {
      users.findUniqueById.mockResolvedValue({ id: userId, streak: 5, last_active: todayStart });

      const result = await service.registerAnswer(userId);

      expect(result).toEqual({ streakDays: 5, streakActive: true });
      expect(users.updateStreak).not.toHaveBeenCalled();
    });

    it('lastActive = yesterday increments streak and updates last_active', async () => {
      users.findUniqueById.mockResolvedValue({
        id: userId,
        streak: 7,
        last_active: yesterdayStart,
      });

      const result = await service.registerAnswer(userId);

      expect(result).toEqual({ streakDays: 8, streakActive: true });
      expect(users.updateStreak).toHaveBeenCalledWith(userId, {
        streak: 8,
        last_active: todayStart,
      });
    });

    it('gap > 1 day resets streak to 0 and active false', async () => {
      users.findUniqueById.mockResolvedValue({
        id: userId,
        streak: 12,
        last_active: twoDaysAgoStart,
      });

      const result = await service.registerAnswer(userId);

      expect(result).toEqual({ streakDays: 0, streakActive: false });
      expect(users.updateStreak).toHaveBeenCalledWith(userId, {
        streak: 0,
        last_active: todayStart,
      });
    });

    it('lastActive = yesterday with streak null treats current as 0 and increments to 1', async () => {
      users.findUniqueById.mockResolvedValue({
        id: userId,
        streak: null,
        last_active: yesterdayStart,
      });

      const result = await service.registerAnswer(userId);

      expect(result).toEqual({ streakDays: 1, streakActive: true });
      expect(users.updateStreak).toHaveBeenCalledWith(userId, {
        streak: 1,
        last_active: todayStart,
      });
    });
  });

  describe('getStreak', () => {
    it('throws NotFoundException when user does not exist', async () => {
      users.findUniqueById.mockResolvedValue(null);

      await expect(service.getStreak(userId)).rejects.toBeInstanceOf(NotFoundException);
      expect(users.updateStreak).not.toHaveBeenCalled();
    });

    it('lastActive null returns 0 / false without writes', async () => {
      users.findUniqueById.mockResolvedValue({ id: userId, streak: null, last_active: null });

      const result = await service.getStreak(userId);

      expect(result).toEqual({ streakDays: 0, streakActive: false });
      expect(users.updateStreak).not.toHaveBeenCalled();
    });

    it('lastActive = today returns current streak with active true and no writes', async () => {
      users.findUniqueById.mockResolvedValue({ id: userId, streak: 3, last_active: todayStart });

      const result = await service.getStreak(userId);

      expect(result).toEqual({ streakDays: 3, streakActive: true });
      expect(users.updateStreak).not.toHaveBeenCalled();
    });

    it('lastActive = yesterday returns current streak with active false (not answered today yet)', async () => {
      users.findUniqueById.mockResolvedValue({
        id: userId,
        streak: 4,
        last_active: yesterdayStart,
      });

      const result = await service.getStreak(userId);

      expect(result).toEqual({ streakDays: 4, streakActive: false });
      expect(users.updateStreak).not.toHaveBeenCalled();
    });

    it('gap > 1 day persists reset to 0 and returns active false', async () => {
      users.findUniqueById.mockResolvedValue({
        id: userId,
        streak: 10,
        last_active: twoDaysAgoStart,
      });

      const result = await service.getStreak(userId);

      expect(result).toEqual({ streakDays: 0, streakActive: false });
      expect(users.updateStreak).toHaveBeenCalledWith(userId, { streak: 0 });
    });
  });
});
