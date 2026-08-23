/*
  Warnings:

  - You are about to drop the column `url` on the `project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "project" DROP COLUMN "url",
ADD COLUMN     "liveUrl" TEXT,
ADD COLUMN     "repoUrl" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
