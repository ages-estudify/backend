import { Module } from '@nestjs/common';
import { SubjectController } from './subjects.controller';
import { SubjectService } from './subjects.service';
import { SubjectRepository } from './subjects.repository';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [SubjectController],
  providers: [SubjectService, PrismaService, SubjectRepository],
  exports: [SubjectService],
})
export class SubjectModule {}
