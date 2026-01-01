-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
