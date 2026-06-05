import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { StreakService } from './streak.service';

@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [StreakService],
  exports: [StreakService],
})
export class StreakModule {}
