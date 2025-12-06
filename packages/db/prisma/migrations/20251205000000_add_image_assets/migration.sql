-- CreateTable
CREATE TABLE "image_asset" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "versionId" TEXT,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "requestId" TEXT,
    "url" VARCHAR(1000) NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "contentType" VARCHAR(100) NOT NULL,
    "aspectRatio" VARCHAR(20),
    "width" INTEGER,
    "height" INTEGER,
    "nsfw" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_asset_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "image_asset_organizationId_idx" ON "image_asset"("organizationId");
CREATE INDEX "image_asset_userId_idx" ON "image_asset"("userId");
CREATE INDEX "image_asset_templateId_idx" ON "image_asset"("templateId");
CREATE INDEX "image_asset_versionId_idx" ON "image_asset"("versionId");
CREATE INDEX "image_asset_createdAt_idx" ON "image_asset"("createdAt");

-- Foreign Keys (note: user/organization use "_id" column via @map)
ALTER TABLE "image_asset" ADD CONSTRAINT "image_asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "image_asset" ADD CONSTRAINT "image_asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "image_asset" ADD CONSTRAINT "image_asset_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "image_asset" ADD CONSTRAINT "image_asset_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "template_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;
