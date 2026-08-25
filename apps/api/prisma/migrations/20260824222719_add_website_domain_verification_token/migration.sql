-- AlterTable
ALTER TABLE "website_domain" ADD COLUMN     "verificationToken" TEXT;

-- Backfill existing rows
UPDATE "website_domain"
SET "verificationToken" = md5(random()::text || clock_timestamp()::text || id)
WHERE "verificationToken" IS NULL;

-- AlterTable
ALTER TABLE "website_domain" ALTER COLUMN "verificationToken" SET NOT NULL;
