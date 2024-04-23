/*
  Warnings:

  - You are about to drop the `progresses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "progresses" DROP CONSTRAINT "progresses_userId_fkey";

-- DropTable
DROP TABLE "progresses";
