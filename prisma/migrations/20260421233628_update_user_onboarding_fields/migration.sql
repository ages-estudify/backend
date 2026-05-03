/*
  Warnings:

  - You are about to drop the column `desired_exam` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `target_university` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "desired_exam",
DROP COLUMN "target_university",
ADD COLUMN     "desired_university" TEXT,
ADD COLUMN     "preferred_language" "Language";
