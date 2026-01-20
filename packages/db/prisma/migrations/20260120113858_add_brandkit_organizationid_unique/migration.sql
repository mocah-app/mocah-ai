-- /migrations/20260120113858_add_brandkit_organizationid_unique/migration.sql
-- Add missing unique constraint on organizationId
ALTER TABLE "brand_kit" ADD CONSTRAINT "brand_kit_organizationId_key" UNIQUE ("organizationId");
