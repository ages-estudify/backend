import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [ExamController],
  providers: [ExamService, PrismaService],
})
export class ExamModule {}
