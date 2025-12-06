/*
  Warnings:

  - The primary key for the `image_asset` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "image_asset" DROP CONSTRAINT "image_asset_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "image_asset_pkey" PRIMARY KEY ("id");
