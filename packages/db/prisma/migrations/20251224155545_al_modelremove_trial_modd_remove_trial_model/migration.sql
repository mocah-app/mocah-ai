/*
  Warnings:

  - You are about to drop the `trial` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "trial" DROP CONSTRAINT "trial_userId_fkey";

-- AlterTable
ALTER TABLE "subscription" ADD COLUMN     "trialCancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trialCancelledAt" TIMESTAMP(3),
ADD COLUMN     "trialConverted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trialConvertedAt" TIMESTAMP(3),
ADD COLUMN     "trialImagesUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trialTemplatesUsed" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "trial";

-- DropEnum
DROP TYPE "TrialStatus";

-- CreateIndex
CREATE INDEX "subscription_trialEnd_idx" ON "subscription"("trialEnd");
