/*
  Warnings:

  - You are about to drop the column `brand_voice` on the `brand_kit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "brand_kit" DROP COLUMN "brand_voice",
ADD COLUMN     "brandVoice" TEXT;
