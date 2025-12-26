/*
  Warnings:

  - Added the required column `itinerary` to the `listings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxGroupSize` to the `listings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `meetingPoint` to the `listings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "images" TEXT[],
ADD COLUMN     "itinerary" TEXT NOT NULL,
ADD COLUMN     "maxGroupSize" INTEGER NOT NULL,
ADD COLUMN     "meetingPoint" TEXT NOT NULL;
