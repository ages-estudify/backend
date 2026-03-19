/*
  Warnings:

  - You are about to drop the `Study_day` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Study_day" DROP CONSTRAINT "Study_day_user_id_fkey";

-- DropTable
DROP TABLE "Study_day";

-- CreateTable
CREATE TABLE "StudyDay" (
    "id" UUID NOT NULL,
    "day" "WeekDay" NOT NULL,
    "hour" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "StudyDay_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudyDay" ADD CONSTRAINT "StudyDay_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
