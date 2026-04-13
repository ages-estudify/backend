import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { GamificationService } from './gamification.service';

@Module({
  imports: [UsersModule],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
