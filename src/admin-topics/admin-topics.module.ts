import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { AdminTopicsController } from './admin-topics.controller';
import { AdminTopicsService } from './admin-topics.service';
import { AdminTopicsRepository } from './admin-topics.repository';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [AdminTopicsController],
  providers: [AdminTopicsService, AdminTopicsRepository, PrismaService],
})
export class AdminTopicsModule {}
