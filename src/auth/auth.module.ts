import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OwnerOrAdminGuard } from './guards/owner-or-admin.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
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
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard, OwnerOrAdminGuard],
  exports: [JwtModule, PassportModule, JwtAuthGuard, RolesGuard, OwnerOrAdminGuard],
})
export class AuthModule {}
