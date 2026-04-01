import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY, SELF_OR_ADMIN_PARAM_KEY } from '../decorators/roles.decorator';
import { JwtAuthUser } from '../security/jwt-auth-user';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const selfOrAdminParam = this.reflector.getAllAndOverride<string | undefined>(
      SELF_OR_ADMIN_PARAM_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest<{
      user?: JwtAuthUser;
      params: Record<string, string>;
    }>();
    const user = request.user;

    if (selfOrAdminParam !== undefined) {
      const resourceId = request.params[selfOrAdminParam];
      if (!user || resourceId === undefined) {
        return false;
      }
      return user.role === Role.ADM || user.userId === resourceId;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) {
      return true;
    }
    if (!user) {
      return false;
    }
    return requiredRoles.includes(user.role);
  }
}
