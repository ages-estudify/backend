import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { AttemptDaysController } from './attempt-days.controller';
import { AttemptDaysRepository } from './attempt-days.repository';
import { AttemptDaysService } from './attempt-days.service';

@Module({
  imports: [AuthModule],
  controllers: [AttemptDaysController],
  providers: [AttemptDaysService, AttemptDaysRepository, PrismaService],
})
export class AttemptDaysModule {}
