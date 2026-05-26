-- AlterTable: add enable column to Question with default true
ALTER TABLE "Question" ADD COLUMN "enable" BOOLEAN NOT NULL DEFAULT true;
