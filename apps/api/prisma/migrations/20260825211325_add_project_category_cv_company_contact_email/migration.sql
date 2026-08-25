-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('DEMO', 'OPEN_SOURCE', 'POC', 'MVP', 'PLATFORM');

-- AlterTable
ALTER TABLE "website" ADD COLUMN     "contactEmail" TEXT;

-- AlterTable
ALTER TABLE "project" ADD COLUMN     "category" "ProjectCategory",
ADD COLUMN     "githubCreatedAt" TIMESTAMP(3),
ADD COLUMN     "githubStars" INTEGER,
ADD COLUMN     "githubUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "cv_document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "logoUrl" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cv_document_userId_key" ON "cv_document"("userId");

-- CreateIndex
CREATE INDEX "company_websiteId_idx" ON "company"("websiteId");

-- AddForeignKey
ALTER TABLE "cv_document" ADD CONSTRAINT "cv_document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
