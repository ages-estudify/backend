import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { SubjectModule } from './subject/subjects.module';
import { PrismaService } from './prisma.service';

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
  ],
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
