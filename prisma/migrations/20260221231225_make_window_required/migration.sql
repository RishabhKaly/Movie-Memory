/*
  Warnings:

  - Made the column `windowStart` on table `Fact` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Fact" ALTER COLUMN "windowStart" SET NOT NULL;
