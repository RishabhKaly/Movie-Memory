/*
  Warnings:

  - You are about to drop the column `movie` on the `Fact` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Fact" DROP CONSTRAINT "Fact_userId_fkey";

-- DropIndex
DROP INDEX "Fact_userId_movie_createdAt_idx";

-- AlterTable
ALTER TABLE "Fact" DROP COLUMN "movie";

-- AddForeignKey
ALTER TABLE "Fact" ADD CONSTRAINT "Fact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
