/*
  Warnings:

  - You are about to drop the column `active` on the `website_token` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `website_token` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "website_token" DROP COLUMN "active",
DROP COLUMN "revokedAt";
