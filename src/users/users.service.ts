import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { UserResponse, UsersRepository } from './users.repository';
import { getLevel } from './utils/levels';

@Injectable()
export class UsersService {

  constructor(private readonly users: UsersRepository) { }

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


  async getStats(userId: string) {

    const questionsStats = await this.users.getQuestionsAnsweredByUser(userId)

    const level = getLevel(questionsStats.correctAnswer)
    const starsStats = await this.users.getStarsAndStreakByUser(userId)

    const topics = await this.users.getCompletedTopicsByUser(userId)
    const subject = await this.users.getSubjectStatsByUser(userId)

    const lastAttepts = await this.users.getLastAttetpsByUser(userId, 5)

    return { questionsStats, level, starsStats, topics, subject }

  }

}
