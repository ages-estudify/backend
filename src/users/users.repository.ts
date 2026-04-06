import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';

export type UserResponse = Omit<User, 'password'>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone_number: phone },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findMany(): Promise<UserResponse[]> {
    return this.prisma.user.findMany({ omit: { password: true } });
  }

  async findUniqueById(id: string): Promise<UserResponse | null> {
    return this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });
  }
}
