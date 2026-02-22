/*
  Warnings:

  - A unique constraint covering the columns `[userId,windowStart]` on the table `Fact` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Fact" ADD COLUMN     "windowStart" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Fact_userId_windowStart_key" ON "Fact"("userId", "windowStart");
