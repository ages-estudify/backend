-- Store S3 object key for exam cover image (not a public URL)
ALTER TABLE "Exam" RENAME COLUMN "image_url" TO "media_key";
