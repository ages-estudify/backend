import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RefreshTokenRepository } from './refresh-token.repository';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../prisma.service';
import { StreakModule } from '../streak/streak.module';
import { StorageModule } from '../storage/storage.module';
import { ProfilePictureService } from './profile-picture.service';

@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => StreakModule), StorageModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    RefreshTokenRepository,
    PrismaService,
    ProfilePictureService,
  ],
  exports: [UsersRepository, RefreshTokenRepository],
})
export class UsersModule {}
