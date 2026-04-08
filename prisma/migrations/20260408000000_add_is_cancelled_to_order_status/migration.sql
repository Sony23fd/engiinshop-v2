-- AlterTable
ALTER TABLE "OrderStatusType" ADD COLUMN "isCancelled" BOOLEAN NOT NULL DEFAULT false;

-- Update existing cancelled statuses
UPDATE "OrderStatusType" SET "isCancelled" = true WHERE "name" IN ('Цуцлагдсан', 'Rejected', 'Canceled');
