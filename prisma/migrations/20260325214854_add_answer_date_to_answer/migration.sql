/*
  Warnings:

  - Added the required column `answer_date` to the `Answer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "answer_date" TIMESTAMP(3) NOT NULL;
