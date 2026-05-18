import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtUserClaims } from '../security/jwt-claims';
import { JwtAuthUser } from '../security/jwt-auth-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev-only-change-me'),
    });
  }

  validate(payload: JwtUserClaims): JwtAuthUser {
    return {
      userId: payload.userId,
      role: payload.role,
      planExpirationDate: payload.planExpirationDate ?? null,
    };
  }
}
