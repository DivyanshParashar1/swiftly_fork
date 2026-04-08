/*
  Warnings:

  - You are about to drop the column `yearsOfExperience` on the `Resume` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "yearsOfExperience",
ADD COLUMN     "yearOfGraduation" INTEGER;
