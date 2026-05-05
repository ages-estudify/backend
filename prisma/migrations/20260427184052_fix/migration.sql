/*
  Warnings:

  - A unique constraint covering the columns `[exam_id,day]` on the table `ExamDay` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `Exam` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "ExamDay" DROP CONSTRAINT "ExamDay_exam_id_fkey";

-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "attempt_id" UUID;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "exam_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "ExamDay_exam_id_day_key" ON "ExamDay"("exam_id", "day");

-- CreateIndex
CREATE INDEX "Question_exam_day_id_idx" ON "Question"("exam_day_id");

-- AddForeignKey
ALTER TABLE "ExamDay" ADD CONSTRAINT "ExamDay_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "Attempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
