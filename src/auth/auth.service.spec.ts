import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { AuthUserRepository } from './repositories/auth-user.repository';

jest.mock('bcrypt');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<Pick<AuthUserRepository, 'findByEmail' | 'findByPhone' | 'create'>>;
  let jwtSign: jest.Mock;

  const dto: RegisterRequestDto = {
    fullName: ' Maria ',
    email: ' MARIA@EMAIL.COM ',
    password: 'password1',
    phone: ' 51999999999 ',
    birthDate: '1999-05-15',
  };

  const fullUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    full_name: 'Maria',
    email: 'maria@email.com',
    password: 'hashed-password',
    phone_number: '51999999999',
    role: Role.USER,
    plan_end_date: null as Date | null,
    birth_date: new Date('1999-05-15T00:00:00.000Z'),
    streak: null as number | null,
    coins: null as number | null,
    createdAt: new Date(),
    enable: true,
    desired_course: null as string | null,
    desired_exam: null as string | null,
    last_active: null as Date | null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    users = {
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      create: jest.fn(),
    };
    jwtSign = jest.fn().mockReturnValue('jwt-token');
    mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthUserRepository, useValue: users },
        { provide: JwtService, useValue: { sign: jwtSign } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('creates user with hashed password, normalizes email/phone, and returns JWT payload', async () => {
    users.findByEmail.mockResolvedValue(null);
    users.findByPhone.mockResolvedValue(null);
    users.create.mockResolvedValue(fullUser);

    const result = await service.register({ ...dto });

    expect(users.findByEmail).toHaveBeenCalledWith('maria@email.com');
    expect(users.findByPhone).toHaveBeenCalledWith('51999999999');
    expect(mockedBcrypt.hash).toHaveBeenCalledWith('password1', 10);
    expect(users.create).toHaveBeenCalledWith({
      full_name: 'Maria',
      email: 'maria@email.com',
      password: 'hashed-password',
      phone_number: '51999999999',
      role: Role.USER,
      birth_date: new Date('1999-05-15T00:00:00.000Z'),
    });
    expect(jwtSign).toHaveBeenCalledWith({
      userId: fullUser.id,
      role: Role.USER,
      planExpirationDate: null,
    });
    expect(result).toEqual({
      userId: fullUser.id,
      token: 'jwt-token',
      role: Role.USER,
      planExpirationDate: null,
    });
  });

  it('rejects duplicate email', async () => {
    users.findByEmail.mockResolvedValue({ id: 'existing' } as never);

    await expect(service.register({ ...dto })).rejects.toMatchObject({
      response: expect.objectContaining({ message: 'Email is already registered' }),
    });
    expect(mockedBcrypt.hash).not.toHaveBeenCalled();
  });

  it('rejects duplicate phone', async () => {
    users.findByEmail.mockResolvedValue(null);
    users.findByPhone.mockResolvedValue({ id: 'existing' } as never);

    await expect(service.register({ ...dto })).rejects.toMatchObject({
      response: expect.objectContaining({ message: 'Phone number is already registered' }),
    });
    expect(mockedBcrypt.hash).not.toHaveBeenCalled();
  });

  it('includes planExpirationDate in JWT when plan_end_date is set', async () => {
    users.findByEmail.mockResolvedValue(null);
    users.findByPhone.mockResolvedValue(null);
    const planEnd = new Date('2026-12-31T12:00:00.000Z');
    users.create.mockResolvedValue({ ...fullUser, plan_end_date: planEnd });

    await service.register({ ...dto });

    expect(jwtSign).toHaveBeenCalledWith({
      userId: fullUser.id,
      role: Role.USER,
      planExpirationDate: '2026-12-31',
    });
  });
});
