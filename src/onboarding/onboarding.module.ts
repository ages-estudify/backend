import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OnboardingRepository } from './onboarding.repository';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingRepository, PrismaService],
})
export class OnboardingModule {}
