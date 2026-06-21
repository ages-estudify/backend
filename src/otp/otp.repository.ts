import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma.service';

export type UserResponse = Omit<User, 'password'>;

@Injectable()
export class OtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByMail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async saveOtp(otpHash: string, user: User) {
    const expireAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.otp.upsert({
      where: {
        user_id: user.id,
      },
      create: {
        otp: otpHash,
        expiresAt: expireAt,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
      update: {
        otp: otpHash,
        expiresAt: expireAt,
      },
    });
  }

  async getOtp(user: User): Promise<string> {
    const otp = await this.prisma.otp.findUnique({
      where: {
        user_id: user.id,
      },
    });

    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      throw new Error('OTP invalido');
    }

    return otp.otp;
  }

  async deleteOtp(email: string) {
    const user: User = await this.findUserByMail(email);

    await this.prisma.otp.delete({
      where: {
        user_id: user.id,
      },
    });
  }

  private async hasValidOtp(user: User): Promise<boolean> {
    const otp = await this.prisma.otp.findUnique({ where: { user_id: user.id } });

    return !!otp && otp.expiresAt.getTime() > Date.now();
  }
}
