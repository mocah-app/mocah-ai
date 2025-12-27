/*
  Warnings:

  - You are about to drop the column `annualDiscountPriceId` on the `plan` table. All the data in the column will be lost.
  - You are about to drop the column `maxImageGenerations` on the `plan` table. All the data in the column will be lost.
  - You are about to drop the column `maxTextGenerations` on the `plan` table. All the data in the column will be lost.
  - You are about to drop the column `maxTokens` on the `plan` table. All the data in the column will be lost.
  - You are about to drop the column `maxWorkspaces` on the `plan` table. All the data in the column will be lost.
  - You are about to drop the column `stripePriceId` on the `plan` table. All the data in the column will be lost.
  - You are about to drop the column `imageGenerations` on the `usage_quota` table. All the data in the column will be lost.
  - You are about to drop the column `limitImageGenerations` on the `usage_quota` table. All the data in the column will be lost.
  - You are about to drop the column `limitTextGenerations` on the `usage_quota` table. All the data in the column will be lost.
  - You are about to drop the column `limitTokens` on the `usage_quota` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `usage_quota` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `usage_quota` table. All the data in the column will be lost.
  - You are about to drop the column `textGenerations` on the `usage_quota` table. All the data in the column will be lost.
  - You are about to drop the column `totalTokens` on the `usage_quota` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripePriceIdMonthly]` on the table `plan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePriceIdAnnual]` on the table `plan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,periodStart]` on the table `usage_quota` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `imagesLimit` to the `usage_quota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan` to the `usage_quota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `templatesLimit` to the `usage_quota` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `usage_quota` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PlanName" AS ENUM ('starter', 'pro', 'scale');

-- CreateEnum
CREATE TYPE "TrialStatus" AS ENUM ('active', 'converted', 'cancelled', 'expired');

-- DropForeignKey
ALTER TABLE "usage_quota" DROP CONSTRAINT "usage_quota_organizationId_fkey";

-- DropIndex
DROP INDEX "plan_stripePriceId_key";

-- DropIndex
DROP INDEX "usage_quota_organizationId_idx";

-- DropIndex
DROP INDEX "usage_quota_organizationId_userId_period_periodStart_key";

-- AlterTable
ALTER TABLE "plan" DROP COLUMN "annualDiscountPriceId",
DROP COLUMN "maxImageGenerations",
DROP COLUMN "maxTextGenerations",
DROP COLUMN "maxTokens",
DROP COLUMN "maxWorkspaces",
DROP COLUMN "stripePriceId",
ADD COLUMN     "annualPrice" DECIMAL(10,2),
ADD COLUMN     "hasPremiumImageModel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasPriorityQueue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imagesLimit" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "stripePriceIdAnnual" TEXT,
ADD COLUMN     "stripePriceIdMonthly" TEXT,
ADD COLUMN     "templatesLimit" INTEGER NOT NULL DEFAULT 75;

-- AlterTable
ALTER TABLE "usage_quota" DROP COLUMN "imageGenerations",
DROP COLUMN "limitImageGenerations",
DROP COLUMN "limitTextGenerations",
DROP COLUMN "limitTokens",
DROP COLUMN "organizationId",
DROP COLUMN "period",
DROP COLUMN "textGenerations",
DROP COLUMN "totalTokens",
ADD COLUMN     "imagesLimit" INTEGER NOT NULL,
ADD COLUMN     "imagesUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "plan" "PlanName" NOT NULL,
ADD COLUMN     "templatesLimit" INTEGER NOT NULL,
ADD COLUMN     "templatesUsed" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "userId" SET NOT NULL;

-- CreateTable
CREATE TABLE "trial" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "plan" "PlanName" NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "templatesUsed" INTEGER NOT NULL DEFAULT 0,
    "imagesUsed" INTEGER NOT NULL DEFAULT 0,
    "templatesLimit" INTEGER NOT NULL DEFAULT 5,
    "imagesLimit" INTEGER NOT NULL DEFAULT 5,
    "status" "TrialStatus" NOT NULL DEFAULT 'active',
    "convertedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancellation_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "reason" TEXT,
    "feedback" TEXT,
    "wouldRecommend" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cancellation_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trial_userId_key" ON "trial"("userId");

-- CreateIndex
CREATE INDEX "trial_userId_idx" ON "trial"("userId");

-- CreateIndex
CREATE INDEX "trial_stripeCustomerId_idx" ON "trial"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "trial_status_idx" ON "trial"("status");

-- CreateIndex
CREATE INDEX "trial_expiresAt_idx" ON "trial"("expiresAt");

-- CreateIndex
CREATE INDEX "cancellation_feedback_userId_idx" ON "cancellation_feedback"("userId");

-- CreateIndex
CREATE INDEX "cancellation_feedback_createdAt_idx" ON "cancellation_feedback"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "plan_stripePriceIdMonthly_key" ON "plan"("stripePriceIdMonthly");

-- CreateIndex
CREATE UNIQUE INDEX "plan_stripePriceIdAnnual_key" ON "plan"("stripePriceIdAnnual");

-- CreateIndex
CREATE INDEX "usage_quota_userId_periodStart_periodEnd_idx" ON "usage_quota"("userId", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "usage_quota_userId_periodStart_key" ON "usage_quota"("userId", "periodStart");

-- AddForeignKey
ALTER TABLE "trial" ADD CONSTRAINT "trial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
