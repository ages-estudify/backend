-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "target_university" TEXT;
