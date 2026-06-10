import { ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
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

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  amountOfAttempts: number = 5;

  constructor(private readonly users: UsersRepository) {}

  async findAll(): Promise<UserResponse[]> {
    return this.users.findMany();
  }

  async findOne(viewer: JwtAuthUser, id: string): Promise<UserResponse> {
    this.ensureSelfOrAdmin(viewer, id);
    this.logger.log(`Searching for User Profile: ${id}`);
    const user = await this.users.findUniqueById(id);
    if (!user) {
      throw new NotFoundException();
    }

    return user;
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
}
