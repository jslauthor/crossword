/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `progresses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[puzzleId,userId]` on the table `progresses` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "progresses_id_key" ON "progresses"("id");

-- CreateIndex
CREATE INDEX "progresses_userId_idx" ON "progresses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "progresses_puzzleId_userId_key" ON "progresses"("puzzleId", "userId");
