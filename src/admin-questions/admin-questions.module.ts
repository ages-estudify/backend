import { Module } from '@nestjs/common';
import { AdminQuestionsController } from './admin-questions.controller';
import { AdminQuestionsService } from './admin-questions.service';
import { AdminQuestionsRepository } from './admin-questions.repository';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AdminQuestionsController],
  providers: [AdminQuestionsService, AdminQuestionsRepository, PrismaService],
})
export class AdminQuestionsModule {}
