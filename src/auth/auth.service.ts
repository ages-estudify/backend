import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { UsersRepository } from '../users/users.repository';
import { RegisterRequestDto } from './dto/register-request.dto';
import { JwtUserClaims } from './security/jwt-claims';

export type RegisterResult = {
  userId: string;
  token: string;
  role: Role;
  planExpirationDate: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
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

    const planExpirationDate = this.formatPlanDate(user.plan_end_date);
    const payload: JwtUserClaims = {
      userId: user.id,
      role: user.role,
      planExpirationDate,
    };

    const token = this.jwt.sign(payload);

    return {
      userId: user.id,
      token,
      role: user.role,
      planExpirationDate,
    };
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
