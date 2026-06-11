import { Role } from '@prisma/client';

export type JwtUserClaims = {
  userId: string;
  role: Role;
  planExpirationDate: string | null;
  purpose?: 'password_reset' | null;
};
