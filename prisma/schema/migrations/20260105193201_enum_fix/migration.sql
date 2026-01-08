/*
Warnings:

- Changed the type of `title` on the `categories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
-- ALTER TABLE "categories" DROP COLUMN "title",
-- ADD COLUMN     "title" TEXT NOT NULL;

-- DropEnum
-- DROP TYPE "TourCategory";

-- Updated One
-- 1️⃣ Add a temporary column
ALTER TABLE "categories" ADD COLUMN "title_new" TEXT;

-- 2️⃣ Copy enum values into text
UPDATE "categories" SET "title_new" = "title"::text;

-- 3️⃣ Drop old enum column
ALTER TABLE "categories" DROP COLUMN "title";

-- 4️⃣ Rename temp column
ALTER TABLE "categories" RENAME COLUMN "title_new" TO "title";

-- 5️⃣ Enforce NOT NULL
ALTER TABLE "categories" ALTER COLUMN "title" SET NOT NULL;

-- 6️⃣ Remove enum type (only if unused)
DROP TYPE IF EXISTS "TourCategory";