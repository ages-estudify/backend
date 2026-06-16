import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, Language, WeekDay } from '@prisma/client';
import { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { ScheduleService } from '../schedule/schedule.service';

const createUserBuilder = (overrides: Partial<any> = {}) => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  full_name: 'Test User',
  email: 'test@example.com',
  phone_number: '123456789',
  role: Role.USER,
  plan_end_date: null,
  streak: null,
  coins: 0,
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  enable: true,
  desired_course: null,
  desired_university: null,
  preferred_language: null,
  onboarding_completed: false,
  last_active: null,
  birth_date: null,

  desired_university: null,
  preferred_language: Language.ENGLISH,
  onboarding_completed: false,

  ...overrides,
});

const createUserWithCoins = (coins: number) => createUserBuilder({ coins });
const createUserWithoutCoins = () => createUserBuilder({ coins: null });

describe('UsersService', () => {
  let service: UsersService;
  let scheduleServiceMock: { generateRecalculatedLogs: jest.Mock };
  let usersRepo: {
    findMany: jest.Mock;
    findUniqueById: jest.Mock;

    getAnswerOverviewByUser: jest.Mock;
    getStarsAndStreakByUser: jest.Mock;
    getCompletedTopicsByUser: jest.Mock;
    getSubjectStatsByUser: jest.Mock;
    getLastAttemptsByUser: jest.Mock;
    updatePreferencesTx: jest.Mock;
  };

  beforeEach(async () => {
    usersRepo = {
      findMany: jest.fn(),
      findUniqueById: jest.fn(),

      getAnswerOverviewByUser: jest.fn(),
      getStarsAndStreakByUser: jest.fn(),
      getCompletedTopicsByUser: jest.fn(),
      getSubjectStatsByUser: jest.fn(),
      getLastAttemptsByUser: jest.fn(),
      updatePreferencesTx: jest.fn(),
    };

    scheduleServiceMock = {
      generateRecalculatedLogs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepo },
        { provide: ScheduleService, useValue: scheduleServiceMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findOne throws when viewer cannot access target', async () => {
    const viewer: JwtAuthUser = {
      userId: '11111111-1111-1111-1111-111111111111',
      role: Role.USER,
      planExpirationDate: null,
    };
    await expect(
      service.findOne(viewer, '22222222-2222-2222-2222-222222222222'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(usersRepo.findUniqueById).not.toHaveBeenCalled();
  });

  it('findOne returns user when allowed and row exists', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const viewer: JwtAuthUser = {
      userId: id,
      role: Role.USER,
      planExpirationDate: null,
    };
    const row = { id, email: 'a@b.com', plan_end_date: null };
    usersRepo.findUniqueById.mockResolvedValue(row as never);

    await expect(service.findOne(viewer, id)).resolves.toEqual({
      ...row,
      plan_status: 'inactive',
    });
    expect(usersRepo.findUniqueById).toHaveBeenCalledWith(id);
  });

  it('findOne throws when user row missing', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const viewer: JwtAuthUser = {
      userId: id,
      role: Role.USER,
      planExpirationDate: null,
    };
    usersRepo.findUniqueById.mockResolvedValue(null);

    await expect(service.findOne(viewer, id)).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('getCoins', () => {
    it('should return coins when user exists', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const user = createUserWithCoins(10);
      usersRepo.findUniqueById.mockResolvedValue(user);

      const result = await service.getCoins(id);

      expect(result).toBe(10);
      expect(usersRepo.findUniqueById).toHaveBeenCalledWith(id);
    });

    it('should return 0 when coins is null', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const user = createUserWithoutCoins();
      usersRepo.findUniqueById.mockResolvedValue(user);

      const result = await service.getCoins(id);

      expect(result).toBe(0);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      usersRepo.findUniqueById.mockResolvedValue(null);

      await expect(service.getCoins(id)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  it('should return full user stats', async () => {
    const userId = 'user-id';

    const overview = {
      totalAnswered: 100,
      totalCorrect: 50,
      accuracyPercentage: 50,
    };

    const level = {
      current: 3,
      max: 10,
    };

    const stars = {
      coins: 10,
      streak: 5,
    };

    const topics = {
      completed: 2,
      total: 10,
    };

    const subject = [
      {
        subjectId: '1',
        subjectName: 'Math',
        correct: 10,
        totalAnswered: 20,
      },
    ];

    const attempts = [
      {
        attemptId: 'a1',
        examName: 'ENEM',
        date: new Date().toISOString(),
        days: [],
      },
    ];

    usersRepo.getAnswerOverviewByUser.mockResolvedValue(overview as any);
    usersRepo.getStarsAndStreakByUser.mockResolvedValue(stars as any);
    usersRepo.getCompletedTopicsByUser.mockResolvedValue(topics as any);
    usersRepo.getSubjectStatsByUser.mockResolvedValue(subject as any);
    usersRepo.getLastAttemptsByUser.mockResolvedValue(attempts as any);

    const result = await service.getStats(userId);

    expect(result.data.overview).toEqual(overview);
    expect(result.data.level).toEqual(level);
    expect(result.data.stars).toBe(10);
    expect(result.data.streak).toBe(5);
    expect(result.data.simulados).toEqual(attempts);
    expect(result.data.accuracyBySubject).toEqual(subject);
  });

  it('should return empty stats for new user', async () => {
    usersRepo.getAnswerOverviewByUser.mockResolvedValue({
      totalAnswered: 0,
      totalCorrect: 0,
      accuracyPercentage: 0,
    } as any);

    usersRepo.getStarsAndStreakByUser.mockResolvedValue({
      coins: 0,
      streak: 0,
    } as any);

    usersRepo.getCompletedTopicsByUser.mockResolvedValue({
      completed: 0,
      total: 0,
    } as any);

    usersRepo.getSubjectStatsByUser.mockResolvedValue([]);
    usersRepo.getLastAttemptsByUser.mockResolvedValue([]);

    const result = await service.getStats('user-id');

    expect(result.data.overview.totalAnswered).toBe(0);
    expect(result.data.stars).toBe(0);
    expect(result.data.simulados).toEqual([]);
    expect(result.data.accuracyBySubject).toEqual([]);
  });

  describe('updatePreferences', () => {
    const userId = '11111111-1111-1111-1111-111111111111';

    beforeEach(() => {
      usersRepo.findUniqueById.mockResolvedValue({ id: userId, email: 'teste@teste.com' });
    });

    it('Should throw NotFoundException if user does not exist', async () => {
      usersRepo.findUniqueById.mockResolvedValue(null);

      await expect(service.updatePreferences(userId, {})).rejects.toBeInstanceOf(NotFoundException);
      expect(usersRepo.updatePreferencesTx).not.toHaveBeenCalled();
    });

    it('Must update only profile data while not sending studyHours', async () => {
      const dto = {
        name: 'New name',
        desiredCourse: 'Engineering',
      };

      const result = await service.updatePreferences(userId, dto);

      expect(result).toEqual({
        success: true,
        message: 'Preferências atualizadas e cronograma recalculado.',
      });
      expect(usersRepo.updatePreferencesTx).toHaveBeenCalledWith(
        userId,
        { full_name: 'New name', desired_course: 'Engineering' },
        undefined,
        expect.any(Date),
        undefined,
      );
      expect(scheduleServiceMock.generateRecalculatedLogs).not.toHaveBeenCalled();
    });

    it('Should update schedule and call transaction if studyHours is valid', async () => {
      const dto = {
        studyHours: {
          [WeekDay.MONDAY]: [18, 19],
        },
      };

      const generatedMock = [{ date: new Date(), path_id: 'p1', user_id: userId, done: false }];
      scheduleServiceMock.generateRecalculatedLogs.mockResolvedValue(generatedMock);

      const result = await service.updatePreferences(userId, dto);

      expect(result.success).toBe(true);
      expect(scheduleServiceMock.generateRecalculatedLogs).toHaveBeenCalledWith(
        userId,
        [
          { user_id: userId, day: WeekDay.MONDAY, hour: 18 },
          { user_id: userId, day: WeekDay.MONDAY, hour: 19 },
        ],
        expect.any(Date),
      );
      expect(usersRepo.updatePreferencesTx).toHaveBeenCalledWith(
        userId,
        {},
        [
          { user_id: userId, day: WeekDay.MONDAY, hour: 18 },
          { user_id: userId, day: WeekDay.MONDAY, hour: 19 },
        ],
        expect.any(Date),
        generatedMock,
      );
    });
  });
});
