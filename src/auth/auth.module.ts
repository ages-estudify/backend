import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule,
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
  providers: [AuthService],
})
export class AuthModule {}
