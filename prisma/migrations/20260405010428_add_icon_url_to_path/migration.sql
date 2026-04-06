/*
  Warnings:

  - Added the required column `icon_url` to the `Path` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Path" ADD COLUMN     "icon_url" TEXT NOT NULL;
