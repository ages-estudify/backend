import { Role } from '@prisma/client';

/** Populated on `request.user` after JwtAuthGuard. */
export type JwtAuthUser = {
  userId: string;
  role: Role;
  planExpirationDate: string | null;
  purpose?: 'password_reset' | null;
};