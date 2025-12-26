/*
  Warnings:

  - You are about to drop the column `hourlyRate` on the `guides` table. All the data in the column will be lost.
  - Made the column `dailyRate` on table `guides` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "guides" DROP COLUMN "hourlyRate",
ADD COLUMN     "languages" TEXT[],
ALTER COLUMN "dailyRate" SET NOT NULL,
ALTER COLUMN "experience" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "tourists" ADD COLUMN     "gender" "Gender",
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "travelPreferences" TEXT;
