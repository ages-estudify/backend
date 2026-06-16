import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RefreshTokenRepository } from './refresh-token.repository';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../prisma.service';
import { StreakModule } from '../streak/streak.module';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => StreakModule), ScheduleModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, RefreshTokenRepository, PrismaService],
  exports: [UsersRepository, RefreshTokenRepository],
})
export class UsersModule {}
