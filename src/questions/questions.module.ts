import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsRepository } from './questions.repository';
import { PrismaService } from '../prisma.service';
import { GamificationModule } from '../gamification/gamification.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [GamificationModule, UsersModule],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsRepository, PrismaService],
})
export class QuestionsModule {}
