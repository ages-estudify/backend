/*
  Warnings:

  - You are about to drop the column `attempt_id` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `current_question` on the `Attempt` table. All the data in the column will be lost.
  - You are about to drop the column `day` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `exam_id` on the `Question` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_attempt_id_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_exam_id_fkey";

-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "attempt_id",
ADD COLUMN     "attempt_day_id" UUID;

-- AlterTable
ALTER TABLE "Attempt" DROP COLUMN "current_question";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "day",
DROP COLUMN "exam_id",
ADD COLUMN     "exam_day_id" UUID;

-- CreateTable
CREATE TABLE "ExamDay" (
    "id" UUID NOT NULL,
    "day" INTEGER NOT NULL,
    "exam_id" UUID NOT NULL,

    CONSTRAINT "ExamDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptDay" (
    "id" UUID NOT NULL,
    "time_spent_minutes" INTEGER NOT NULL,
    "current_question" INTEGER NOT NULL,
    "init_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "attempt_id" UUID NOT NULL,
    "exam_day_id" UUID NOT NULL,

    CONSTRAINT "AttemptDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttemptDay_attempt_id_exam_day_id_key" ON "AttemptDay"("attempt_id", "exam_day_id");

-- AddForeignKey
ALTER TABLE "ExamDay" ADD CONSTRAINT "ExamDay_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptDay" ADD CONSTRAINT "AttemptDay_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "Attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptDay" ADD CONSTRAINT "AttemptDay_exam_day_id_fkey" FOREIGN KEY ("exam_day_id") REFERENCES "ExamDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_exam_day_id_fkey" FOREIGN KEY ("exam_day_id") REFERENCES "ExamDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_attempt_day_id_fkey" FOREIGN KEY ("attempt_day_id") REFERENCES "AttemptDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;
