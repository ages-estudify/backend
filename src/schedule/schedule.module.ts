import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { ScheduleRepository } from './schedule.repository';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ScheduleController],
  providers: [ScheduleService, ScheduleRepository, PrismaService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
