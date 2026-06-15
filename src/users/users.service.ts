import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma, Role, WeekDay } from '@prisma/client';
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
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { ScheduleService } from 'src/schedule/schedule.service';
import { GetUserProfileResponseDto } from './dto/get-user-profile-response.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  amountOfAttempts: number = 5;

  constructor(
    private readonly users: UsersRepository,
    private readonly scheduleService: ScheduleService,
  ) {}

  async findAll(): Promise<UserResponse[]> {
    return this.users.findMany();
  }

  async findOne(viewer: JwtAuthUser, id: string): Promise<GetUserProfileResponseDto> {
    this.ensureSelfOrAdmin(viewer, id);
    this.logger.log(`Searching for User Profile: ${id}`);
    const user = await this.users.findUniqueById(id);
    if (!user) {
      throw new NotFoundException();
    }

    const now = new Date();
    const planEndDate = user.plan_end_date;
    const planStatus = planEndDate != null && planEndDate >= now ? 'active' : 'inactive';
    return {
      ...user,
      plan_status: planStatus,
    };
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

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const user = await this.users.findUniqueById(userId);
    if (!user) throw new NotFoundException('User not found');

    const userUpdate: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) userUpdate.full_name = dto.name;
    if (dto.desiredCourse !== undefined) userUpdate.desired_course = dto.desiredCourse;
    if (dto.desiredUniversity !== undefined) userUpdate.desired_university = dto.desiredUniversity;
    if (dto.preferredLanguage !== undefined) userUpdate.preferred_language = dto.preferredLanguage;

    let newStudyDays: Prisma.StudyDayCreateManyInput[] | undefined = undefined;
    let newLogs: Prisma.StudyLogCreateManyInput[] | undefined = undefined;

    const threshold = new Date();
    threshold.setUTCHours(23, 59, 59, 999);

    if (dto.studyHours !== undefined) {
      newStudyDays = [];
      const entries = Object.entries(dto.studyHours);

      if (entries.length > 0) {
        for (const [day, hours] of entries) {
          const weekDays = Object.values(WeekDay);

          if (!weekDays.includes(day as WeekDay)) {
            throw new BadRequestException(`Invalid day: ${day}`);
          }

          if (!hours || hours.length === 0) {
            throw new BadRequestException(`Time not informed for ${day}`);
          }

          for (const hour of hours) {
            if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
              throw new BadRequestException(`Invalid time: ${hour}`);
            }
            newStudyDays.push({ user_id: userId, day: day as WeekDay, hour });
          }

          if (new Set(hours).size !== hours.length) {
            throw new BadRequestException('Duplicated time not allowed');
          }
        }

        newLogs = await this.scheduleService.generateRecalculatedLogs(
          userId,
          newStudyDays,
          threshold,
        );
      } else {
        newLogs = [];
      }
    }

    return { success: true, message: 'Preferências atualizadas e cronograma recalculado.' };
  }
}
