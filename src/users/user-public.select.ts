import { Prisma } from '@prisma/client';

/** Fields exposed by user listing/detail APIs (excludes password). */
export const userPublicSelect = {
  id: true,
  full_name: true,
  email: true,
  phone_number: true,
  role: true,
  plan_end_date: true,
  streak: true,
  coins: true,
  createdAt: true,
  enable: true,
  desired_course: true,
  desired_exam: true,
  last_active: true,
  birth_date: true,
} satisfies Prisma.UserSelect;

export type UserPublic = Prisma.UserGetPayload<{ select: typeof userPublicSelect }>;
