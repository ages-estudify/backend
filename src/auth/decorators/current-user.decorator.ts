import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtAuthUser } from '../security/jwt-auth-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtAuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtAuthUser }>();
    return request.user;
  },
);
