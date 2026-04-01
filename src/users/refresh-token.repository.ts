import { Injectable } from '@nestjs/common';
import { RefreshToken, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findValidByHashWithUser(
    tokenHash: string,
  ): Promise<(RefreshToken & { user: User }) | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!row) return null;
    if (row.expiresAt <= new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: row.id } }).catch(() => undefined);
      return null;
    }
    return row;
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.refreshToken.delete({ where: { id } });
  }
}
