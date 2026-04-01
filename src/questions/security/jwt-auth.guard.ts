import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = process.env.JWT_SECRET ?? 'secret';

    try {
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;

      if (typeof payload === 'object' && payload !== null && 'userId' in payload) {
        const userId = payload.userId;
        if (typeof userId === 'string') {
          request.user = { userId };
        } else {
          throw new UnauthorizedException('Invalid token payload');
        }
      } else {
        throw new UnauthorizedException('Invalid token payload');
      }
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }
}
