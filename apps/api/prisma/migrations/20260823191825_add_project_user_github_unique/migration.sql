/*
  Warnings:

  - A unique constraint covering the columns `[userId,githubId]` on the table `project` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "project_userId_githubId_key" ON "project"("userId", "githubId");
