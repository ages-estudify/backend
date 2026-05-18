import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptExamsController } from './exam-attempt.controller';
import { PrismaService } from '../../prisma.service';
import { AttemptsRepository } from './attempts.repository';
import { ExamsService } from '../exams.service';
import { ExamsRepository } from '../exams.repository';

@Module({
  controllers: [AttemptExamsController],
  providers: [AttemptsService, PrismaService, AttemptsRepository, ExamsService, ExamsRepository],
})
export class AttemptExamsModule {}
