import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ExamService } from './exams.service';
import { ExamRepository } from './exams.repository';
import { ExamsController } from './exams.controller';

@Module({
  controllers: [ExamsController],
  providers: [ExamService, PrismaService, ExamRepository],
  exports: [ExamService],
})
export class ExamModule {}
