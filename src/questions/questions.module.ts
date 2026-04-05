import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsRepository } from './questions.repository';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsRepository, PrismaService],
  exports: [QuestionsRepository],
})
export class QuestionsModule {}
