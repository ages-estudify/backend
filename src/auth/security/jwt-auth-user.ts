import { Role } from '@prisma/client';
import { Purpose } from './jwt-claims';

/** Populated on `request.user` after JwtAuthGuard. */
export type JwtAuthUser = {
  userId: string;
  role: Role;
  planExpirationDate: string | null;
  purpose: Purpose;
};
