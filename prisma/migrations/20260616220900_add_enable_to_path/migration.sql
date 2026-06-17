-- Soft-delete flag for learning topics (Path); existing rows stay enabled
ALTER TABLE "Path" ADD COLUMN "enable" BOOLEAN NOT NULL DEFAULT true;
