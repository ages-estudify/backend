import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<Pick<UsersService, 'findAll' | 'findOne'>>;

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findOne delegates to users service', async () => {
    const userRow = { id: '550e8400-e29b-41d4-a716-446655440000', email: 'a@b.com' };
    const viewer: JwtAuthUser = {
      userId: userRow.id,
      role: Role.USER,
      planExpirationDate: null,
    };
    usersService.findOne.mockResolvedValue(userRow as never);

    await expect(controller.findOne(viewer, userRow.id)).resolves.toEqual(userRow);
    expect(usersService.findOne).toHaveBeenCalledWith(viewer, userRow.id);
  });
});
