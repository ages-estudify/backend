import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { SubjectModule } from './subject/subjects.module';
import { QuestionsModule } from './questions/questions.module';
import { GamificationModule } from './gamification/gamification.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ExamsModule } from './exams/exams.module';
import { AttemptDaysModule } from './attempt-days/attempt-days.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PrismaService } from './prisma.service';
import { AttemptExamsModule } from './exams/attempts/exam-attempt.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    UsersModule,
    HealthModule,
    AuthModule,
    SubjectModule,
    QuestionsModule,
    GamificationModule,
    AttemptExamsModule,
    SubscriptionsModule,
    ExamsModule,
    AttemptDaysModule,
    OnboardingModule,
  ],
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}