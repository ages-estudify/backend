import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthUser } from '../security/jwt-auth-user';

const USER_ID_PARAM = 'id';

@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: JwtAuthUser;
      params: Record<string, string>;
    }>();
    const user = request.user;
    const resourceId = request.params[USER_ID_PARAM];

    if (!user || resourceId === undefined) {
      throw new ForbiddenException();
    }
    if (user.role === Role.ADM || user.userId === resourceId) {
      return true;
    }
    throw new ForbiddenException();
  }
}
