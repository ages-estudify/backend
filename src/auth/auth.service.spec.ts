import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RefreshTokenRepository } from '../users/refresh-token.repository';
import { UsersRepository } from '../users/users.repository';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/register-request.dto';

jest.mock('bcrypt');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<Pick<UsersRepository, 'findByEmail' | 'findByPhone' | 'create'>>;
  let refreshTokens: jest.Mocked<
    Pick<RefreshTokenRepository, 'create' | 'findValidByHashWithUser' | 'deleteById'>
  >;
  let jwtSign: jest.Mock;
  let configGet: jest.Mock;

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
    refreshTokens = {
      create: jest.fn().mockResolvedValue({ id: 'rt' } as never),
      findValidByHashWithUser: jest.fn(),
      deleteById: jest.fn().mockResolvedValue(undefined),
    };
    jwtSign = jest.fn().mockReturnValue('jwt-token');
    configGet = jest.fn().mockReturnValue(undefined);
    mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: users },
        { provide: RefreshTokenRepository, useValue: refreshTokens },
        { provide: JwtService, useValue: { sign: jwtSign } },
        { provide: ConfigService, useValue: { get: configGet } },
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
    expect(refreshTokens.create).toHaveBeenCalledWith(
      fullUser.id,
      expect.any(String),
      expect.any(Date),
    );
    expect(result).toMatchObject({
      userId: fullUser.id,
      token: 'jwt-token',
      role: Role.USER,
      planExpirationDate: null,
    });
    expect(result.refreshToken.length).toBeGreaterThan(20);
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

  it('uses BCRYPT_ROUNDS from config when valid', async () => {
    configGet.mockImplementation((key: string) => (key === 'BCRYPT_ROUNDS' ? '12' : undefined));
    users.findByEmail.mockResolvedValue(null);
    users.findByPhone.mockResolvedValue(null);
    users.create.mockResolvedValue(fullUser);

    await service.register({ ...dto });

    expect(mockedBcrypt.hash).toHaveBeenCalledWith('password1', 12);
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

  describe('login', () => {
    const loginDto = { email: 'maria@email.com', password: 'secret' };

    beforeEach(() => {
      mockedBcrypt.compare.mockReset();
    });

    it('returns token and signs JWT when credentials are valid', async () => {
      users.findByEmail.mockResolvedValue(fullUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.login(loginDto);

      expect(users.findByEmail).toHaveBeenCalledWith('maria@email.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('secret', fullUser.password);
      expect(jwtSign).toHaveBeenCalledWith({
        userId: fullUser.id,
        role: Role.USER,
        planExpirationDate: null,
      });
      expect(refreshTokens.create).toHaveBeenCalled();
      expect(result).toMatchObject({
        token: 'jwt-token',
        role: Role.USER,
        planExpirationDate: null,
      });
      expect(result.refreshToken.length).toBeGreaterThan(20);
    });

    it('rejects when user does not exist', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toMatchObject({
        response: expect.objectContaining({ message: 'Invalid credentials' }),
      });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(jwtSign).not.toHaveBeenCalled();
    });

    it('rejects when password is incorrect', async () => {
      users.findByEmail.mockResolvedValue(fullUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toMatchObject({
        response: expect.objectContaining({ message: 'Invalid credentials' }),
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('secret', fullUser.password);
      expect(jwtSign).not.toHaveBeenCalled();
    });

    it('rejects when account is disabled', async () => {
      users.findByEmail.mockResolvedValue({ ...fullUser, enable: false });

      await expect(service.login(loginDto)).rejects.toMatchObject({
        response: expect.objectContaining({ message: 'Invalid credentials' }),
      });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('includes planExpirationDate in JWT when user has a plan end date', async () => {
      const planEnd = new Date('2026-06-01T00:00:00.000Z');
      users.findByEmail.mockResolvedValue({ ...fullUser, plan_end_date: planEnd });
      mockedBcrypt.compare.mockResolvedValue(true as never);

      await service.login(loginDto);

      expect(jwtSign).toHaveBeenCalledWith({
        userId: fullUser.id,
        role: Role.USER,
        planExpirationDate: '2026-06-01',
      });
    });

    it('normalizes email with trim and lowercase', async () => {
      users.findByEmail.mockResolvedValue(fullUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      await service.login({ email: '  MARIA@EMAIL.COM  ', password: 'secret' });

      expect(users.findByEmail).toHaveBeenCalledWith('maria@email.com');
    });
  });

  describe('refresh', () => {
    const refreshRow = {
      id: 'refresh-row-id',
      tokenHash: 'hash',
      user_id: fullUser.id,
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      user: fullUser,
    };

    it('rotates refresh token and returns new access token', async () => {
      refreshTokens.findValidByHashWithUser.mockResolvedValue(refreshRow as never);

      const result = await service.refresh({ refreshToken: 'client-refresh-token' });

      expect(refreshTokens.deleteById).toHaveBeenCalledWith('refresh-row-id');
      expect(refreshTokens.create).toHaveBeenCalled();
      expect(jwtSign).toHaveBeenCalledWith({
        userId: fullUser.id,
        role: Role.USER,
        planExpirationDate: null,
      });
      expect(result).toMatchObject({
        token: 'jwt-token',
        role: Role.USER,
        planExpirationDate: null,
      });
      expect(result.refreshToken.length).toBeGreaterThan(20);
    });

    it('rejects invalid refresh token', async () => {
      refreshTokens.findValidByHashWithUser.mockResolvedValue(null);

      await expect(service.refresh({ refreshToken: 'bad' })).rejects.toMatchObject({
        response: expect.objectContaining({ message: 'Invalid refresh token' }),
      });
      expect(refreshTokens.deleteById).not.toHaveBeenCalled();
    });

    it('rejects when user is disabled', async () => {
      refreshTokens.findValidByHashWithUser.mockResolvedValue({
        ...refreshRow,
        user: { ...fullUser, enable: false },
      } as never);

      await expect(service.refresh({ refreshToken: 'tok' })).rejects.toMatchObject({
        response: expect.objectContaining({ message: 'Invalid refresh token' }),
      });
    });
  });
});
