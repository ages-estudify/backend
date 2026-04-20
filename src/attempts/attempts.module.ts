import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [AttemptsController],
  providers: [AttemptsService, PrismaService],
})
export class AttemptsModule {}
