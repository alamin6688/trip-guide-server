/*
  Warnings:

  - Added the required column `contactNumber` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactNumber` to the `guides` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `guides` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "contactNumber" TEXT NOT NULL,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profilePhoto" TEXT;

-- AlterTable
ALTER TABLE "guides" ADD COLUMN     "address" TEXT,
ADD COLUMN     "contactNumber" TEXT NOT NULL,
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profilePhoto" TEXT;

-- AlterTable
ALTER TABLE "tourists" ADD COLUMN     "address" TEXT,
ADD COLUMN     "contactNumber" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profilePhoto" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "needPasswordChange" BOOLEAN NOT NULL DEFAULT true;
