-- Add brandVoice field to BrandKit table
ALTER TABLE "brand_kit" ADD COLUMN IF NOT EXISTS "brand_voice" VARCHAR(50);

