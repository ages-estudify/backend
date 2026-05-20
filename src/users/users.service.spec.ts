import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

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
  ...overrides,
});

const createUserWithCoins = (coins: number) => createUserBuilder({ coins });
const createUserWithoutCoins = () => createUserBuilder({ coins: null });

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: jest.Mocked<Pick<UsersRepository, 'findMany' | 'findUniqueById'>>;

  beforeEach(async () => {
    usersRepo = {
      findMany: jest.fn(),
      findUniqueById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: UsersRepository, useValue: usersRepo }],
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
    const row = { id, email: 'a@b.com' } as never;
    usersRepo.findUniqueById.mockResolvedValue(row);

    await expect(service.findOne(viewer, id)).resolves.toEqual(row);
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
});
