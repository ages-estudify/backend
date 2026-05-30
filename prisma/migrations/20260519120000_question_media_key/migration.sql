-- Rename image column to media_key (stores S3 object key, not a public URL)
ALTER TABLE "Question" RENAME COLUMN "image" TO "media_key";
