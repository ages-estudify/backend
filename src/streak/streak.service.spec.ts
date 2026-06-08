import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../users/users.repository';
import { StreakService } from './streak.service';

describe('StreakService', () => {
  let service: StreakService;
  let users: { findUniqueById: jest.Mock; updateStreak: jest.Mock };

  const userId = '11111111-1111-1111-1111-111111111111';

  // 15h UTC = 12h BRT em 15/06/2026; "agora" cai dentro do dia 15/06 em Brasil
  // independente do fuso onde o teste rodar (CI em UTC, local em BRT etc).
  const fixedNow = new Date(Date.UTC(2026, 5, 15, 15, 0, 0));

  // Inputs: qualquer instante dentro do respectivo dia Brasil
  const todayBR = new Date(Date.UTC(2026, 5, 15, 15, 0, 0));
  const yesterdayBR = new Date(Date.UTC(2026, 5, 14, 15, 0, 0));
  const twoDaysAgoBR = new Date(Date.UTC(2026, 5, 13, 15, 0, 0));

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
        last_active: fixedNow,
      });
    });

    it('lastActive = today keeps streak unchanged and active', async () => {
      users.findUniqueById.mockResolvedValue({ id: userId, streak: 5, last_active: todayBR });

      const result = await service.registerAnswer(userId);

      expect(result).toEqual({ streakDays: 5, streakActive: true });
      expect(users.updateStreak).not.toHaveBeenCalled();
    });

    it('lastActive = yesterday increments streak and updates last_active', async () => {
      users.findUniqueById.mockResolvedValue({
        id: userId,
        streak: 7,
        last_active: yesterdayBR,
      });

      const result = await service.registerAnswer(userId);

      expect(result).toEqual({ streakDays: 8, streakActive: true });
      expect(users.updateStreak).toHaveBeenCalledWith(userId, {
        streak: 8,
        last_active: fixedNow,
      });
    });

    it('gap > 1 day resets streak to 0 and active false', async () => {
      users.findUniqueById.mockResolvedValue({
        id: userId,
        streak: 12,
        last_active: twoDaysAgoBR,
      });

      const result = await service.registerAnswer(userId);

      expect(result).toEqual({ streakDays: 0, streakActive: false });
      expect(users.updateStreak).toHaveBeenCalledWith(userId, {
        streak: 0,
        last_active: fixedNow,
      });
    });

    it('lastActive = yesterday with streak null treats current as 0 and increments to 1', async () => {
      users.findUniqueById.mockResolvedValue({
        id: userId,
        streak: null,
        last_active: yesterdayBR,
      });

      const result = await service.registerAnswer(userId);

      expect(result).toEqual({ streakDays: 1, streakActive: true });
      expect(users.updateStreak).toHaveBeenCalledWith(userId, {
        streak: 1,
        last_active: fixedNow,
      });
    });

    it('respostas repetidas no mesmo dia nao incrementam (regressao: last_active persistido reentra como mesmo dia)', async () => {
      // 1a resposta: last_active null -> persiste o instante real (fixedNow)
      users.findUniqueById.mockResolvedValueOnce({ id: userId, streak: null, last_active: null });
      const first = await service.registerAnswer(userId);
      expect(first).toEqual({ streakDays: 1, streakActive: true });
      expect(users.updateStreak).toHaveBeenLastCalledWith(userId, {
        streak: 1,
        last_active: fixedNow,
      });

      // 2a resposta no mesmo dia: relê o last_active persistido (fixedNow) -> gapDays=0
      users.updateStreak.mockClear();
      users.findUniqueById.mockResolvedValueOnce({ id: userId, streak: 1, last_active: fixedNow });
      const second = await service.registerAnswer(userId);
      expect(second).toEqual({ streakDays: 1, streakActive: true });
      expect(users.updateStreak).not.toHaveBeenCalled();
    });

    it('respostas em 23h, 00:10 e 00:20 (dias consecutivos) incrementam streak para 3', async () => {
      // Dia 1 às 23h BRT (= 02h UTC do dia 2)
      const day1At23BRT = new Date(Date.UTC(2026, 5, 16, 2, 0, 0));
      // Dia 2 às 00:10 BRT (= 03:10 UTC do dia 2)
      const day2At0010BRT = new Date(Date.UTC(2026, 5, 16, 3, 10, 0));
      // Dia 3 às 00:20 BRT (= 03:20 UTC do dia 3)
      const day3At0020BRT = new Date(Date.UTC(2026, 5, 17, 3, 20, 0));

      // Primeira resposta: dia 1 às 23h (last_active=null)
      jest.setSystemTime(day1At23BRT);
      users.findUniqueById.mockResolvedValueOnce({ id: userId, streak: null, last_active: null });
      let result = await service.registerAnswer(userId);
      expect(result).toEqual({ streakDays: 1, streakActive: true });

      // Segunda resposta: dia 2 às 00:10 (last_active=dia 1 às 23h)
      jest.setSystemTime(day2At0010BRT);
      users.findUniqueById.mockResolvedValueOnce({
        id: userId,
        streak: 1,
        last_active: day1At23BRT,
      });
      result = await service.registerAnswer(userId);
      expect(result).toEqual({ streakDays: 2, streakActive: true });
      expect(users.updateStreak).toHaveBeenLastCalledWith(userId, {
        streak: 2,
        last_active: day2At0010BRT,
      });

      // Terceira resposta: dia 3 às 00:20 (last_active=dia 2)
      jest.setSystemTime(day3At0020BRT);
      users.findUniqueById.mockResolvedValueOnce({
        id: userId,
        streak: 2,
        last_active: day2At0010BRT,
      });
      result = await service.registerAnswer(userId);
      expect(result).toEqual({ streakDays: 3, streakActive: true });
      expect(users.updateStreak).toHaveBeenLastCalledWith(userId, {
        streak: 3,
        last_active: day3At0020BRT,
      });

      jest.setSystemTime(fixedNow);
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
      users.findUniqueById.mockResolvedValue({ id: userId, streak: 3, last_active: todayBR });

      const result = await service.getStreak(userId);

      expect(result).toEqual({ streakDays: 3, streakActive: true });
      expect(users.updateStreak).not.toHaveBeenCalled();
    });

    it('lastActive = yesterday returns current streak with active false (not answered today yet)', async () => {
      users.findUniqueById.mockResolvedValue({
        id: userId,
        streak: 4,
        last_active: yesterdayBR,
      });

      const result = await service.getStreak(userId);

      expect(result).toEqual({ streakDays: 4, streakActive: false });
      expect(users.updateStreak).not.toHaveBeenCalled();
    });

    it('gap > 1 day persists reset to 0 and returns active false', async () => {
      users.findUniqueById.mockResolvedValue({
        id: userId,
        streak: 10,
        last_active: twoDaysAgoBR,
      });

      const result = await service.getStreak(userId);

      expect(result).toEqual({ streakDays: 0, streakActive: false });
      expect(users.updateStreak).toHaveBeenCalledWith(userId, { streak: 0 });
    });
  });
});
