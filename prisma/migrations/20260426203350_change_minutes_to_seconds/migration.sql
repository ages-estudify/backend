/*
  Warnings:

  - You are about to drop the column `time_spent_minutes` on the `Attempt` table. All the data in the column will be lost.
  - You are about to drop the column `time_spent_minutes` on the `AttemptDay` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Attempt" DROP COLUMN "time_spent_minutes",
ADD COLUMN     "time_spent_seconds" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "AttemptDay" DROP COLUMN "time_spent_minutes",
ADD COLUMN     "time_spent_seconds" INTEGER NOT NULL DEFAULT 0;
