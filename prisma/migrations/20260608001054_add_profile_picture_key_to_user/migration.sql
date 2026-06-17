-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profile_picture_key" TEXT;
