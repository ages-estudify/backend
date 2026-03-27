/*
  Warnings:

  - You are about to drop the column `topic_id` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `topic_id` on the `StudyLog` table. All the data in the column will be lost.
  - You are about to drop the `Topic` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id,path_id,date]` on the table `StudyLog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone_number]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `path_id` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path_id` to the `StudyLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_topic_id_fkey";

-- DropForeignKey
ALTER TABLE "StudyLog" DROP CONSTRAINT "StudyLog_topic_id_fkey";

-- DropForeignKey
ALTER TABLE "Topic" DROP CONSTRAINT "Topic_subject_id_fkey";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "topic_id",
ADD COLUMN     "path_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "StudyLog" DROP COLUMN "topic_id",
ADD COLUMN     "path_id" UUID NOT NULL;

-- DropTable
DROP TABLE "Topic";

-- CreateTable
CREATE TABLE "Path" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "subject_id" UUID NOT NULL,

    CONSTRAINT "Path_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Path_subject_id_position_key" ON "Path"("subject_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "StudyLog_user_id_path_id_date_key" ON "StudyLog"("user_id", "path_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");

-- AddForeignKey
ALTER TABLE "StudyLog" ADD CONSTRAINT "StudyLog_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "Path"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Path" ADD CONSTRAINT "Path_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "Path"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
