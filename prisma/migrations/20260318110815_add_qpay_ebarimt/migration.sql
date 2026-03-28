-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "ebarimtAmount" TEXT,
ADD COLUMN     "ebarimtId" TEXT,
ADD COLUMN     "ebarimtLottery" TEXT,
ADD COLUMN     "ebarimtQr" TEXT,
ADD COLUMN     "qpayInvoiceId" TEXT,
ADD COLUMN     "qpayQrText" TEXT,
ADD COLUMN     "qpayUrls" JSONB;
