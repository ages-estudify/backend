import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException, Logger,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { RegisterRequestDto } from '../auth/dto/register-request.dto';
import { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { UserResponse, UsersRepository } from './users.repository';
import { UpdateUserRequestDto } from './dto/update-user-request.dto';
import { getLevel } from './utils/levels';
import { UserStatsMapper } from './mapper/user-stats-mapper';
import { ProfilePictureService } from './profile-picture.service';
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
import { GetUserProfileResponseDto } from './dto/get-user-profile-response.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  amountOfAttempts: number = 5;

  constructor(

    private readonly users: UsersRepository,
    private readonly config: ConfigService,
    private readonly profilePictureService: ProfilePictureService,
  ) { }

  async createUser(dto: RegisterRequestDto): Promise<UserResponse> {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();

    if (await this.users.findByEmail(email)) {
      throw new ConflictException('Email is already registered');
    }
    if (await this.users.findByPhone(phone)) {
      throw new ConflictException('Phone number is already registered');
    }

    const rounds = this.resolveBcryptRounds();
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    const user = await this.users.create({
      full_name: dto.fullName.trim(),
      email,
      password: passwordHash,
      phone_number: phone,
      role: Role.USER,
      birth_date: new Date(`${dto.birthDate}T00:00:00.000Z`),
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...rest } = user;
    return rest;
  }

  async updateUser(
    viewer: JwtAuthUser,
    id: string,
    dto: UpdateUserRequestDto,
  ): Promise<UserResponse> {
    this.ensureSelfOrAdmin(viewer, id);

    const existing = await this.users.findUniqueById(id);
    if (!existing) throw new NotFoundException();

    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const conflict = await this.users.findByEmail(email);
      if (conflict && conflict.id !== id) {
        throw new ConflictException('Email is already registered');
      }
    }

    if (dto.phone) {
      const phone = dto.phone.trim();
      const conflict = await this.users.findByPhone(phone);
      if (conflict && conflict.id !== id) {
        throw new ConflictException('Phone number is already registered');
      }
    }

    return this.users.update(id, {
      ...(dto.fullName !== undefined && { full_name: dto.fullName.trim() }),
      ...(dto.email !== undefined && { email: dto.email.trim().toLowerCase() }),
      ...(dto.phone !== undefined && { phone_number: dto.phone.trim() }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.planEndDate !== undefined && { plan_end_date: new Date(dto.planEndDate) }),
      ...(dto.streak !== undefined && { streak: dto.streak }),
      ...(dto.coins !== undefined && { coins: dto.coins }),
      ...(dto.desiredCourse !== undefined && { desired_course: dto.desiredCourse }),
      ...(dto.desiredUniversity !== undefined && { desired_university: dto.desiredUniversity }),
      ...(dto.preferredLanguage !== undefined && { preferred_language: dto.preferredLanguage }),
      ...(dto.birthDate !== undefined && {
        birth_date: new Date(`${dto.birthDate}T00:00:00.000Z`),
      }),
    });
  }

  async disableUser(id: string): Promise<void> {
    const existing = await this.users.findUniqueById(id);
    if (!existing) throw new NotFoundException();
    await this.users.disable(id);
  }

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

  async uploadProfilePicture(userId: string, imageBase64: string): Promise<string> {
    const key = await this.profilePictureService.upload(userId, imageBase64);
    await this.users.updateProfilePicture(userId, key);
    const url = await this.profilePictureService.resolveSignedUrl(key);
    return url!;
  }

  async removeProfilePicture(userId: string): Promise<void> {
    await this.users.updateProfilePicture(userId, null);
  }
}
