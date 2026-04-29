import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { ExamRepository } from './exam.repository';

@Module({
  imports: [AuthModule],
  controllers: [ExamController],
  providers: [ExamService, ExamRepository, PrismaService],
})
export class ExamModule {}
