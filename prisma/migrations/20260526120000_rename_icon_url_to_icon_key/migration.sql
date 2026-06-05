-- Store S3 object key (or legacy path ref), not a public URL
ALTER TABLE "Subject" RENAME COLUMN "icon_url" TO "icon_key";
ALTER TABLE "Path" RENAME COLUMN "icon_url" TO "icon_key";
