import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, Language, WeekDay } from '@prisma/client';
import { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { ScheduleService } from '../schedule/schedule.service';
import { ProfilePictureService } from './profile-picture.service';
import { Purpose } from '../auth/security/jwt-claims';

const createUserBuilder = (overrides: Partial<any> = {}) => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  full_name: 'Test User',
  email: 'test@example.com',
  phone_number: '123456789',
  password: 'hashed',
  role: Role.USER,
  plan_end_date: null,
  streak: null,
  coins: 0,
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  enable: true,
  desired_course: null,
  desired_university: null,
  preferred_language: Language.ENGLISH,
  onboarding_completed: false,
  last_active: null,
  birth_date: null,
  profile_picture: null,
  ...overrides,
});

const createUserWithCoins = (coins: number) => createUserBuilder({ coins });
const createUserWithoutCoins = () => createUserBuilder({ coins: null });

const makeViewer = (overrides: Partial<JwtAuthUser> = {}): JwtAuthUser => ({
  userId: '550e8400-e29b-41d4-a716-446655440000',
  role: Role.USER,
  planExpirationDate: null,
  purpose: Purpose.DEFAULT,
  ...overrides,
});

describe('UsersService', () => {
  let service: UsersService;
  let scheduleServiceMock: { generateRecalculatedLogs: jest.Mock };
  let usersRepo: {
    findMany: jest.Mock;
    findUniqueById: jest.Mock;
    findByEmail: jest.Mock;
    findByPhone: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    disable: jest.Mock;
    updatePassword: jest.Mock;
    updateProfilePicture: jest.Mock;
    getAnswerOverviewByUser: jest.Mock;
    getStarsAndStreakByUser: jest.Mock;
    getCompletedTopicsByUser: jest.Mock;
    getSubjectStatsByUser: jest.Mock;
    getLastAttemptsByUser: jest.Mock;
    updatePreferencesTx: jest.Mock;
  };
  let configService: { get: jest.Mock };
  let profilePictureService: {
    upload: jest.Mock;
    resolveSignedUrl: jest.Mock;
  };

  beforeEach(async () => {
    usersRepo = {
      findMany: jest.fn(),
      findUniqueById: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      disable: jest.fn(),
      updatePassword: jest.fn(),
      updateProfilePicture: jest.fn(),
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

    configService = { get: jest.fn() };

    profilePictureService = {
      upload: jest.fn(),
      resolveSignedUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepo },
        { provide: ScheduleService, useValue: scheduleServiceMock },
        { provide: ConfigService, useValue: configService },
        { provide: ProfilePictureService, useValue: profilePictureService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createUser ───────────────────────────────────────────────────────────

  describe('createUser', () => {
    const dto = {
      fullName: 'New User',
      email: 'new@example.com',
      phone: '987654321',
      password: 'secret',
      birthDate: '1999-05-15',
    };

    it('creates a user and strips password from response', async () => {
      usersRepo.findByEmail.mockResolvedValue(null);
      usersRepo.findByPhone.mockResolvedValue(null);
      const created = createUserBuilder({ email: dto.email });
      usersRepo.create.mockResolvedValue(created);

      const result = await service.createUser(dto as any);

      expect(result).not.toHaveProperty('password');
      expect(usersRepo.create).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when email is taken', async () => {
      usersRepo.findByEmail.mockResolvedValue(createUserBuilder());
      await expect(service.createUser(dto as any)).rejects.toBeInstanceOf(ConflictException);
      expect(usersRepo.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when phone is taken', async () => {
      usersRepo.findByEmail.mockResolvedValue(null);
      usersRepo.findByPhone.mockResolvedValue(createUserBuilder());
      await expect(service.createUser(dto as any)).rejects.toBeInstanceOf(ConflictException);
      expect(usersRepo.create).not.toHaveBeenCalled();
    });

    it('normalises email to lowercase and trims whitespace', async () => {
      usersRepo.findByEmail.mockResolvedValue(null);
      usersRepo.findByPhone.mockResolvedValue(null);
      usersRepo.create.mockResolvedValue(createUserBuilder());

      await service.createUser({ ...dto, email: '  UPPER@EXAMPLE.COM  ' } as any);

      expect(usersRepo.findByEmail).toHaveBeenCalledWith('upper@example.com');
    });

    it('uses fallback bcrypt rounds when config is missing', async () => {
      configService.get.mockReturnValue(undefined);
      usersRepo.findByEmail.mockResolvedValue(null);
      usersRepo.findByPhone.mockResolvedValue(null);
      usersRepo.create.mockResolvedValue(createUserBuilder());

      await expect(service.createUser(dto as any)).resolves.not.toThrow();
    });

    it('uses configured bcrypt rounds when valid', async () => {
      configService.get.mockReturnValue('12');
      usersRepo.findByEmail.mockResolvedValue(null);
      usersRepo.findByPhone.mockResolvedValue(null);
      usersRepo.create.mockResolvedValue(createUserBuilder());

      await expect(service.createUser(dto as any)).resolves.not.toThrow();
    });
  });

  // ─── updateUser ───────────────────────────────────────────────────────────

  describe('updateUser', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const viewer = makeViewer({ userId: id });

    it('throws ForbiddenException when viewer is not self or admin', async () => {
      const other = makeViewer({ userId: 'aaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      await expect(service.updateUser(other, id, {} as any)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when user does not exist', async () => {
      usersRepo.findUniqueById.mockResolvedValue(null);
      await expect(service.updateUser(viewer, id, {} as any)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ConflictException when new email is taken by another user', async () => {
      usersRepo.findUniqueById.mockResolvedValue(createUserBuilder());
      usersRepo.findByEmail.mockResolvedValue(createUserBuilder({ id: 'other-id' }));

      await expect(
        service.updateUser(viewer, id, { email: 'taken@example.com' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('allows email update when the conflict belongs to same user', async () => {
      const existing = createUserBuilder();
      usersRepo.findUniqueById.mockResolvedValue(existing);
      usersRepo.findByEmail.mockResolvedValue(existing); // same id
      usersRepo.update.mockResolvedValue(existing);

      await expect(
        service.updateUser(viewer, id, { email: 'test@example.com' } as any),
      ).resolves.toBeDefined();
    });

    it('throws ConflictException when new phone is taken by another user', async () => {
      usersRepo.findUniqueById.mockResolvedValue(createUserBuilder());
      usersRepo.findByPhone.mockResolvedValue(createUserBuilder({ id: 'other-id' }));

      await expect(
        service.updateUser(viewer, id, { phone: '111111111' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('allows phone update when the conflict belongs to same user', async () => {
      const existing = createUserBuilder();
      usersRepo.findUniqueById.mockResolvedValue(existing);
      usersRepo.findByPhone.mockResolvedValue(existing); // same id
      usersRepo.update.mockResolvedValue(existing);

      await expect(
        service.updateUser(viewer, id, { phone: '123456789' } as any),
      ).resolves.toBeDefined();
    });

    it('succeeds when admin updates another user', async () => {
      const admin = makeViewer({ userId: 'admin-id', role: Role.ADM });
      const existing = createUserBuilder();
      usersRepo.findUniqueById.mockResolvedValue(existing);
      usersRepo.update.mockResolvedValue(existing);

      await expect(service.updateUser(admin, id, { streak: 3 } as any)).resolves.toBeDefined();
    });

    it('updates all optional fields when provided', async () => {
      const existing = createUserBuilder();
      usersRepo.findUniqueById.mockResolvedValue(existing);
      usersRepo.update.mockResolvedValue(existing);

      await service.updateUser(viewer, id, {
        fullName: 'New Name',
        streak: 5,
        coins: 20,
        desiredCourse: 'Medicina',
        desiredUniversity: 'USP',
        preferredLanguage: Language.ENGLISH,
        planEndDate: '2026-12-31T00:00:00.000Z',
        birthDate: '1999-05-15',
      } as any);

      expect(usersRepo.update).toHaveBeenCalledWith(
        id,
        expect.objectContaining({
          full_name: 'New Name',
          streak: 5,
          coins: 20,
        }),
      );
    });
  });

  // ─── disableUser ──────────────────────────────────────────────────────────

  describe('disableUser', () => {
    it('disables the user when found', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      usersRepo.findUniqueById.mockResolvedValue(createUserBuilder());
      usersRepo.disable.mockResolvedValue(undefined);

      await service.disableUser(id);

      expect(usersRepo.disable).toHaveBeenCalledWith(id);
    });

    it('throws NotFoundException when user does not exist', async () => {
      usersRepo.findUniqueById.mockResolvedValue(null);
      await expect(service.disableUser('non-existent')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all users from repository', async () => {
      const users = [createUserBuilder(), createUserBuilder({ id: 'other-id' })];
      usersRepo.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(usersRepo.findMany).toHaveBeenCalledTimes(1);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('throws when viewer cannot access target', async () => {
      const viewer = makeViewer({ userId: '11111111-1111-1111-1111-111111111111' });
      await expect(
        service.findOne(viewer, '22222222-2222-2222-2222-222222222222'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(usersRepo.findUniqueById).not.toHaveBeenCalled();
    });

    it('returns user with plan_status inactive when plan_end_date is null', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const viewer = makeViewer({ userId: id });
      const row = createUserBuilder({ plan_end_date: null });
      usersRepo.findUniqueById.mockResolvedValue(row);

      const result = await service.findOne(viewer, id);

      expect(result.plan_status).toBe('inactive');
    });

    it('returns user with plan_status active when plan is in the future', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const viewer = makeViewer({ userId: id });
      const futureDate = new Date(Date.now() + 86400_000);
      const row = createUserBuilder({ plan_end_date: futureDate });
      usersRepo.findUniqueById.mockResolvedValue(row);

      const result = await service.findOne(viewer, id);

      expect(result.plan_status).toBe('active');
    });

    it('returns user with plan_status inactive when plan has expired', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const viewer = makeViewer({ userId: id });
      const pastDate = new Date(Date.now() - 86400_000);
      const row = createUserBuilder({ plan_end_date: pastDate });
      usersRepo.findUniqueById.mockResolvedValue(row);

      const result = await service.findOne(viewer, id);

      expect(result.plan_status).toBe('inactive');
    });

    it('throws NotFoundException when user row is missing', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const viewer = makeViewer({ userId: id });
      usersRepo.findUniqueById.mockResolvedValue(null);

      await expect(service.findOne(viewer, id)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('admin can access any user', async () => {
      const admin = makeViewer({ userId: 'admin-id', role: Role.ADM });
      const target = '550e8400-e29b-41d4-a716-446655440000';
      const row = createUserBuilder();
      usersRepo.findUniqueById.mockResolvedValue(row);

      const result = await service.findOne(admin, target);

      expect(result).toMatchObject({ id: target });
    });
  });

  // ─── updateUserPassword ───────────────────────────────────────────────────

  describe('updateUserPassword', () => {
    it('hashes the new password and updates it', async () => {
      usersRepo.updatePassword.mockResolvedValue(undefined);

      await service.updateUserPassword('user-id', 'newSecret');

      expect(usersRepo.updatePassword).toHaveBeenCalledWith('user-id', expect.any(String));
      const storedHash = usersRepo.updatePassword.mock.calls[0][1] as string;
      expect(storedHash).not.toBe('newSecret');
    });
  });

  // ─── getCoins ─────────────────────────────────────────────────────────────

  describe('getCoins', () => {
    it('returns coins when user exists', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      usersRepo.findUniqueById.mockResolvedValue(createUserWithCoins(10));

      expect(await service.getCoins(id)).toBe(10);
      expect(usersRepo.findUniqueById).toHaveBeenCalledWith(id);
    });

    it('returns 0 when coins is null', async () => {
      usersRepo.findUniqueById.mockResolvedValue(createUserWithoutCoins());
      expect(await service.getCoins('id')).toBe(0);
    });

    it('throws NotFoundException when user does not exist', async () => {
      usersRepo.findUniqueById.mockResolvedValue(null);
      await expect(service.getCoins('id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ─── uploadProfilePicture ─────────────────────────────────────────────────

  describe('uploadProfilePicture', () => {
    it('uploads, stores the key and returns the signed URL', async () => {
      profilePictureService.upload.mockResolvedValue('s3-key');
      usersRepo.updateProfilePicture.mockResolvedValue(undefined);
      profilePictureService.resolveSignedUrl.mockResolvedValue('https://signed.url');

      const url = await service.uploadProfilePicture('user-id', 'base64data');

      expect(profilePictureService.upload).toHaveBeenCalledWith('user-id', 'base64data');
      expect(usersRepo.updateProfilePicture).toHaveBeenCalledWith('user-id', 's3-key');
      expect(url).toBe('https://signed.url');
    });
  });

  // ─── removeProfilePicture ─────────────────────────────────────────────────

  describe('removeProfilePicture', () => {
    it('sets profile picture to null in repository', async () => {
      usersRepo.updateProfilePicture.mockResolvedValue(undefined);

      await service.removeProfilePicture('user-id');

      expect(usersRepo.updateProfilePicture).toHaveBeenCalledWith('user-id', null);
    });
  });

  // ─── getStats ─────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('returns full user stats', async () => {
      const overview = { totalAnswered: 100, totalCorrect: 50, accuracyPercentage: 50 };
      const stars = { coins: 10, streak: 5 };
      const topics = { completed: 2, total: 10 };
      const subject = [{ subjectId: '1', subjectName: 'Math', correct: 10, totalAnswered: 20 }];
      const attempts = [
        { attemptId: 'a1', examName: 'ENEM', date: new Date().toISOString(), days: [] },
      ];

      usersRepo.getAnswerOverviewByUser.mockResolvedValue(overview as any);
      usersRepo.getStarsAndStreakByUser.mockResolvedValue(stars as any);
      usersRepo.getCompletedTopicsByUser.mockResolvedValue(topics as any);
      usersRepo.getSubjectStatsByUser.mockResolvedValue(subject as any);
      usersRepo.getLastAttemptsByUser.mockResolvedValue(attempts as any);

      const result = await service.getStats('user-id');

      expect(result.data.overview).toEqual(overview);
      expect(result.data.level).toEqual({ current: 3, max: 10 });
      expect(result.data.stars).toBe(10);
      expect(result.data.streak).toBe(5);
      expect(result.data.simulados).toEqual(attempts);
      expect(result.data.accuracyBySubject).toEqual(subject);
    });

    it('returns empty stats for a new user', async () => {
      usersRepo.getAnswerOverviewByUser.mockResolvedValue({
        totalAnswered: 0,
        totalCorrect: 0,
        accuracyPercentage: 0,
      } as any);
      usersRepo.getStarsAndStreakByUser.mockResolvedValue({ coins: 0, streak: 0 } as any);
      usersRepo.getCompletedTopicsByUser.mockResolvedValue({ completed: 0, total: 0 } as any);
      usersRepo.getSubjectStatsByUser.mockResolvedValue([]);
      usersRepo.getLastAttemptsByUser.mockResolvedValue([]);

      const result = await service.getStats('user-id');

      expect(result.data.overview.totalAnswered).toBe(0);
      expect(result.data.stars).toBe(0);
      expect(result.data.simulados).toEqual([]);
      expect(result.data.accuracyBySubject).toEqual([]);
    });
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
