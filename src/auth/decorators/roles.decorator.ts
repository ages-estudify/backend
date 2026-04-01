import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

export const SELF_OR_ADMIN_PARAM_KEY = 'selfOrAdminParam';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const SelfOrAdmin = (paramName: string = 'id') =>
  SetMetadata(SELF_OR_ADMIN_PARAM_KEY, paramName);
