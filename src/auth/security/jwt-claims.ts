import { Role } from '@prisma/client';

export enum Purpose {
  DEFAULT,
  PASSWORDRESET,
}

export type JwtUserClaims = {
  userId: string;
  role: Role;
  planExpirationDate: string | null;
  purpose: Purpose;
};
