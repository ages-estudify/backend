import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { PrismaService } from '../../prisma.service';
import { JwtAuthUser } from '../security/jwt-auth-user';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request.user as JwtAuthUser;

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (user.role === Role.ADM) {
      return true;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: {
        id: user.userId,
      },
      select: {
        enable: true,
        plan_end_date: true,
      },
    });

    if (!dbUser) {
      throw new ForbiddenException({
        success: false,
        message: 'Acesso negado. Assinatura ativa necessária para acessar este conteúdo.',
      });
    }

    if (!dbUser.enable) {
      throw new ForbiddenException({
        success: false,
        message: 'Sua conta está desativada. Entre em contato com o suporte.',
      });
    }

    if (!dbUser.plan_end_date) {
      throw new ForbiddenException({
        success: false,
        message: 'Acesso negado. Assinatura ativa necessária para acessar este conteúdo.',
      });
    }

    if (dbUser.plan_end_date <= new Date()) {
      throw new ForbiddenException({
        success: false,
        message: 'Acesso negado. Assinatura ativa necessária para acessar este conteúdo.',
      });
    }

    return true;
  }
}
