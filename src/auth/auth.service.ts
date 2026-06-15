import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role, User } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { RefreshTokenRepository } from '../users/refresh-token.repository';
import { UsersRepository } from '../users/users.repository';
import { LoginRequestDto } from './dto/login-request.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { JwtUserClaims, Purpose } from './security/jwt-claims';

export type AuthSession = {
  token: string;
  refreshToken: string;
  role: Role;
  planExpirationDate: string | null;
};

export type RegisterResult = AuthSession & { userId: string };

export type LoginResult = AuthSession;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterRequestDto): Promise<RegisterResult> {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();

    if (await this.users.findByEmail(email)) {
      throw new ConflictException('Email is already registered');
    }
    if (await this.users.findByPhone(phone)) {
      throw new ConflictException('Phone number is already registered');
    }

    const bcryptRounds = this.resolveBcryptRounds();
    const passwordHash = await bcrypt.hash(dto.password, bcryptRounds);
    const birthDate = new Date(`${dto.birthDate}T00:00:00.000Z`);

    const user = await this.users.create({
      full_name: dto.fullName.trim(),
      email,
      password: passwordHash,
      phone_number: phone,
      role: Role.USER,
      birth_date: birthDate,
    });

    const session = await this.buildAuthSession(user, Purpose.DEFAULT);
    return { userId: user.id, ...session };
  }

  async login(dto: LoginRequestDto): Promise<LoginResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);

    if (!user || !user.enable) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.password);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const session = await this.buildAuthSession(user, Purpose.DEFAULT);

    this.logger.log(
      JSON.stringify({ event: 'user_login_success', userId: user.id, role: user.role }),
    );

    return session;
  }

  async refresh(dto: RefreshRequestDto): Promise<LoginResult> {
    const tokenHash = this.hashRefreshToken(dto.refreshToken.trim());
    const row = await this.refreshTokens.findValidByHashWithUser(tokenHash);

    if (!row || !row.user.enable) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokens.deleteById(row.id);
    const session = await this.buildAuthSession(row.user, Purpose.DEFAULT);

    return session;
  }

  async buildAuthSession(
    user: Pick<User, 'id' | 'role' | 'plan_end_date'>,
    purpose: Purpose,
  ): Promise<AuthSession> {
    const planExpirationDate = this.formatPlanDate(user.plan_end_date);

    const payload: JwtUserClaims = {
      userId: user.id,
      role: user.role,
      planExpirationDate,
      purpose: purpose,
    };

    const token = this.jwt.sign(payload, {
      ...(purpose === Purpose.PASSWORDRESET ? { expiresIn: '15m' } : {}),
    });

    const refreshToken = await this.persistRefreshToken(user.id);
    return {
      token,
      refreshToken,
      role: user.role,
      planExpirationDate,
    };
  }

  private async persistRefreshToken(userId: string): Promise<string> {
    const raw = randomBytes(48).toString('base64url');
    const tokenHash = this.hashRefreshToken(raw);
    await this.refreshTokens.create(userId, tokenHash, this.refreshExpiresAt());
    return raw;
  }

  private hashRefreshToken(raw: string): string {
    const pepper = this.config.get<string>('REFRESH_TOKEN_PEPPER') ?? '';
    return createHash('sha256')
      .update(raw + pepper)
      .digest('hex');
  }

  private refreshExpiresAt(): Date {
    const days = Number.parseInt(this.config.get<string>('REFRESH_TOKEN_TTL_DAYS') ?? '', 10);
    const ttl = Number.isFinite(days) && days > 0 && days <= 365 ? days : 30;
    const dt = new Date();
    dt.setUTCDate(dt.getUTCDate() + ttl);
    return dt;
  }

  private formatPlanDate(date: Date | null): string | null {
    if (!date) return null;
    return date.toISOString().slice(0, 10);
  }

  private resolveBcryptRounds(): number {
    const parsed = Number.parseInt(this.config.get<string>('BCRYPT_ROUNDS') ?? '', 10);
    if (Number.isFinite(parsed) && parsed >= 4 && parsed <= 15) {
      return parsed;
    }
    return 10;
  }
}
