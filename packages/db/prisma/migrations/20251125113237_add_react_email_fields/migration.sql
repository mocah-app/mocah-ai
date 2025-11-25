-- CreateEnum
CREATE TYPE "StyleType" AS ENUM ('INLINE', 'PREDEFINED_CLASSES', 'STYLE_OBJECTS');

-- AlterTable
ALTER TABLE "template" ADD COLUMN     "htmlCode" TEXT,
ADD COLUMN     "previewText" TEXT,
ADD COLUMN     "reactEmailCode" TEXT,
ADD COLUMN     "styleDefinitions" JSONB,
ADD COLUMN     "styleType" "StyleType" NOT NULL DEFAULT 'STYLE_OBJECTS',
ADD COLUMN     "tableHtmlCode" TEXT;

-- AlterTable
ALTER TABLE "template_version" ADD COLUMN     "htmlCode" TEXT,
ADD COLUMN     "previewText" TEXT,
ADD COLUMN     "reactEmailCode" TEXT,
ADD COLUMN     "styleDefinitions" JSONB,
ADD COLUMN     "styleType" "StyleType" NOT NULL DEFAULT 'STYLE_OBJECTS',
ADD COLUMN     "tableHtmlCode" TEXT;

