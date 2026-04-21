import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminQuestionsController } from './admin-questions.controller';
import { AdminQuestionsService } from './admin-questions.service';
import { AdminQuestionsRepository } from './admin-questions.repository';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [AdminQuestionsController],
  providers: [AdminQuestionsService, AdminQuestionsRepository, PrismaService],
})
export class AdminQuestionsModule {}
