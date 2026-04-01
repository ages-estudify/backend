import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

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
});
