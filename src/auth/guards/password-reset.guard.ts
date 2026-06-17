import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthUser } from '../security/jwt-auth-user';
import { Purpose } from '../security/jwt-claims';

@Injectable()
export class PasswordResetGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user: JwtAuthUser = req.user;

    return user.purpose == Purpose.PASSWORDRESET;
  }
}
