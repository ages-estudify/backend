-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_alternative_id_fkey";

-- AlterTable
ALTER TABLE "Answer" ALTER COLUMN "alternative_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_alternative_id_fkey" FOREIGN KEY ("alternative_id") REFERENCES "Alternative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
