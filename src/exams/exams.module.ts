import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { ExamsController } from './exams.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ExamsController],
  providers: [AttemptsService, PrismaService],
})
export class ExamsModule {}
