/*
  Warnings:

  - You are about to drop the column `content` on the `template` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `template_library` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `template_version` table. All the data in the column will be lost.
  - You are about to drop the column `customContent` on the `workspace_template_library` table. All the data in the column will be lost.
  - You are about to drop the `template_section` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "template_section" DROP CONSTRAINT "template_section_templateId_fkey";

-- AlterTable
ALTER TABLE "template" DROP COLUMN "content";

-- AlterTable
ALTER TABLE "template_library" DROP COLUMN "content",
ADD COLUMN     "previewText" TEXT,
ADD COLUMN     "reactEmailCode" TEXT,
ADD COLUMN     "styleDefinitions" JSONB,
ADD COLUMN     "styleType" "StyleType" NOT NULL DEFAULT 'STYLE_OBJECTS';

-- AlterTable
ALTER TABLE "template_version" DROP COLUMN "content";

-- AlterTable
ALTER TABLE "workspace_template_library" DROP COLUMN "customContent",
ADD COLUMN     "customReactEmailCode" TEXT,
ADD COLUMN     "customStyleDefinitions" JSONB;

-- DropTable
DROP TABLE "template_section";

-- DropEnum
DROP TYPE "TemplateSectionType";
