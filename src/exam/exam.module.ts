import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ExamService } from './exam.service';
import { ExamRepository } from './exam.repository';
import { ExamController } from './exam.controller';

@Module({
  controllers: [ExamController],
  providers: [ExamService, PrismaService, ExamRepository],
  exports: [ExamService],
})
export class ExamModule {}
