/*
  Warnings:

  - You are about to drop the column `estimated_time_minutes` on the `Exam` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Exam" DROP COLUMN "estimated_time_minutes",
ADD COLUMN     "image_url" TEXT;
