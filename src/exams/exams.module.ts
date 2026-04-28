import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { ExamsController } from './exams.controller';
import { PrismaService } from '../prisma.service';
import { AttemptsRepository } from './attempts.repository';

@Module({
  controllers: [ExamsController],
  providers: [AttemptsService, PrismaService, AttemptsRepository],
})
export class ExamsModule {}
