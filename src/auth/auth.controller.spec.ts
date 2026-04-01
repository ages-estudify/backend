import { Role } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';

describe('AuthController', () => {
  it('returns success envelope with register data', async () => {
    const payload = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      token: 'jwt-token',
      refreshToken: 'refresh',
      role: Role.USER,
      planExpirationDate: null as string | null,
    };
    const auth = { register: jest.fn().mockResolvedValue(payload) };
    const controller = new AuthController(auth as unknown as AuthService);

    const body: RegisterRequestDto = {
      fullName: 'Maria',
      email: 'maria@email.com',
      password: 'password1',
      phone: '51999999999',
      birthDate: '1999-05-15',
    };

    await expect(controller.register(body)).resolves.toEqual({
      success: true,
      data: payload,
    });
    expect(auth.register).toHaveBeenCalledWith(body);
  });

  it('returns success envelope with login data', async () => {
    const loginData = {
      token: 'jwt-token',
      refreshToken: 'refresh',
      role: Role.USER,
      planExpirationDate: null as string | null,
    };
    const auth = {
      register: jest.fn(),
      login: jest.fn().mockResolvedValue(loginData),
    };
    const controller = new AuthController(auth as unknown as AuthService);

    const body: LoginRequestDto = {
      email: 'maria@email.com',
      password: 'secret',
    };

    await expect(controller.login(body)).resolves.toEqual({
      success: true,
      data: loginData,
    });
    expect(auth.login).toHaveBeenCalledWith(body);
  });

  it('returns success envelope with refresh data', async () => {
    const session = {
      token: 'new-access',
      refreshToken: 'new-refresh',
      role: Role.USER,
      planExpirationDate: null as string | null,
    };
    const auth = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn().mockResolvedValue(session),
    };
    const controller = new AuthController(auth as unknown as AuthService);

    await expect(controller.refresh({ refreshToken: 'old-refresh' })).resolves.toEqual({
      success: true,
      data: session,
    });
    expect(auth.refresh).toHaveBeenCalledWith({ refreshToken: 'old-refresh' });
  });
});
