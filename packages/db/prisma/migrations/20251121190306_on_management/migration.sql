-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TemplateSectionType" ADD VALUE 'hero';
ALTER TYPE "TemplateSectionType" ADD VALUE 'product_grid';
ALTER TYPE "TemplateSectionType" ADD VALUE 'testimonial';

-- AlterTable
ALTER TABLE "template" ADD COLUMN     "currentVersionId" TEXT;

-- AlterTable
ALTER TABLE "template_version" ADD COLUMN     "isCurrent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "parentVersionId" TEXT;

-- CreateIndex
CREATE INDEX "template_version_isCurrent_idx" ON "template_version"("isCurrent");

-- CreateIndex
CREATE INDEX "template_version_parentVersionId_idx" ON "template_version"("parentVersionId");

-- AddForeignKey
ALTER TABLE "template" ADD CONSTRAINT "template_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "template_version"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_version" ADD CONSTRAINT "template_version_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "template_version"("id") ON DELETE SET NULL ON UPDATE CASCADE;
