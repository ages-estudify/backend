import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { UserResponse, UsersRepository } from './users.repository';
import { getLevel } from './utils/levels';
import { UserStatsMapper } from './mapper/user-stats-mapper';
import {
  CompletedTopicsDto,
  LevelDto,
  OverviewDto,
  UserStatsDto,
  AccuracyBySubjectDto,
  SimuladoDto,
} from './dto/user-stats.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  amountOfAttempts: number = 5;

  constructor(
    private readonly users: UsersRepository,
    private readonly config: ConfigService,
  ) {}

  async findAll(): Promise<UserResponse[]> {
    return this.users.findMany();
  }

  async findOne(viewer: JwtAuthUser, id: string): Promise<UserResponse> {
    this.ensureSelfOrAdmin(viewer, id);
    const user = await this.users.findUniqueById(id);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  async updateUserPassword(id: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, this.resolveBcryptRounds());

    await this.users.updatePassword(id, hashedPassword);
  }

  private ensureSelfOrAdmin(viewer: JwtAuthUser, targetUserId: string): void {
    if (viewer.role === Role.ADM || viewer.userId === targetUserId) {
      return;
    }
    throw new ForbiddenException();
  }

  async getCoins(userId: string): Promise<number> {
    const user = await this.users.findUniqueById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.coins ?? 0;
  }

  async getStats(userId: string): Promise<UserStatsDto> {
    const questionsStats: OverviewDto = await this.users.getAnswerOverviewByUser(userId);
    const level: LevelDto = getLevel(questionsStats.totalCorrect);
    const starsStats = await this.users.getStarsAndStreakByUser(userId);
    const topics: CompletedTopicsDto = await this.users.getCompletedTopicsByUser(userId);
    const subject: AccuracyBySubjectDto[] = await this.users.getSubjectStatsByUser(userId);
    const lastAttepts: SimuladoDto[] = await this.users.getLastAttemptsByUser(
      userId,
      this.amountOfAttempts,
    );

    const response: UserStatsDto = UserStatsMapper.toDto(
      questionsStats,
      level,
      starsStats,
      topics,
      subject,
      lastAttepts,
    );

    return response;
  }

  private resolveBcryptRounds(): number {
    const parsed = Number.parseInt(this.config.get<string>('BCRYPT_ROUNDS') ?? '', 10);
    if (Number.isFinite(parsed) && parsed >= 4 && parsed <= 15) {
      return parsed;
    }
    return 10;
  }
}
