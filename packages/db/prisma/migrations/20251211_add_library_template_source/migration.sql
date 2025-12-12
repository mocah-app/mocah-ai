-- AlterTable
ALTER TABLE "template_library" ADD COLUMN "templateId" TEXT;

-- CreateIndex
CREATE INDEX "template_library_templateId_idx" ON "template_library"("templateId");

-- CreateIndex
CREATE INDEX "template_library_name_idx" ON "template_library"("name");

-- AddForeignKey
ALTER TABLE "template_library" ADD CONSTRAINT "template_library_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
