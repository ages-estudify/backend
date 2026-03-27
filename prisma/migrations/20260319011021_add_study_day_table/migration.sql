-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "Study_day" (
    "id" UUID NOT NULL,
    "day" "WeekDay" NOT NULL,
    "hour" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "Study_day_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Study_day" ADD CONSTRAINT "Study_day_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
