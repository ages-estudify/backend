import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { type UserPublic, userPublicSelect } from './user-public.select';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<UserPublic[]> {
    return this.prisma.user.findMany({ select: userPublicSelect });
  }

  async findOne(id: string): Promise<UserPublic | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: userPublicSelect,
    });
  }
}
