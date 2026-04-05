import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';
import { QuestionsModule } from './questions/questions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    UsersModule,
    HealthModule,
    AuthModule,
    QuestionsModule,
  ],
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
