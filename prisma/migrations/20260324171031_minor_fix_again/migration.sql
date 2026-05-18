/*
  Warnings:

  - You are about to drop the column `position` on the `Path` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[schedule_position]` on the table `Path` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subject_id,trail_position]` on the table `Path` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `schedule_position` to the `Path` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trail_position` to the `Path` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Path_subject_id_position_key";

-- AlterTable
ALTER TABLE "Path" DROP COLUMN "position",
ADD COLUMN     "schedule_position" INTEGER NOT NULL,
ADD COLUMN     "trail_position" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Path_schedule_position_key" ON "Path"("schedule_position");

-- CreateIndex
CREATE UNIQUE INDEX "Path_subject_id_trail_position_key" ON "Path"("subject_id", "trail_position");
