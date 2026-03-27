import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthUserRepository } from './repositories/auth-user.repository';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const expiresSec = Number.parseInt(config.get<string>('JWT_EXPIRES_IN_SEC') ?? '', 10);
        return {
          secret: config.get<string>('JWT_SECRET', 'dev-only-change-me'),
          signOptions: {
            expiresIn:
              Number.isFinite(expiresSec) && expiresSec > 0 ? expiresSec : 60 * 60 * 24 * 7,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthUserRepository, PrismaService],
})
export class AuthModule {}
