-- AlterTable
ALTER TABLE "OrderStatusType" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDeliverable" BOOLEAN NOT NULL DEFAULT false;
