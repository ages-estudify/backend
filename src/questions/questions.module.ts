import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from './security/jwt-auth.guard';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, PrismaService, JwtAuthGuard],
})
export class QuestionsModule {}
