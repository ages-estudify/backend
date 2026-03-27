import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { RegisterRequestDto } from './dto/register-request.dto';
import { AuthUserRepository } from './repositories/auth-user.repository';
import { JwtUserClaims } from './security/jwt-claims';

export type RegisterResult = {
  userId: string;
  token: string;
  role: Role;
  planExpirationDate: string | null;
};

@Injectable()
export class AuthService {
  private static readonly BCRYPT_ROUNDS = 10;

  constructor(
    private readonly users: AuthUserRepository,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterRequestDto): Promise<RegisterResult> {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();

    if (await this.users.findByEmail(email)) {
      throw new BadRequestException('Email is already registered');
    }
    if (await this.users.findByPhone(phone)) {
      throw new BadRequestException('Phone number is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, AuthService.BCRYPT_ROUNDS);
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
}
