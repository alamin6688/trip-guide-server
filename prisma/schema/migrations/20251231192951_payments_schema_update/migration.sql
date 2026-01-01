-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paymentGatewayData" JSONB,
ALTER COLUMN "status" SET DEFAULT 'UNPAID';
