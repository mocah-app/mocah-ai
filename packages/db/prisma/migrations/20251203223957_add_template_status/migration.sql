-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "template" ADD COLUMN     "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "template_status_idx" ON "template"("status");
