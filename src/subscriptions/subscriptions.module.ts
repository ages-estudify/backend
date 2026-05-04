import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsRepository } from './subscriptions.repository';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsRepository, PrismaService],
})
export class SubscriptionsModule {}
