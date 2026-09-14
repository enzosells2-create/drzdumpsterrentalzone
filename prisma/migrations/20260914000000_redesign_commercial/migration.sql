-- DropIndex
DROP INDEX "CommercialAccount_confirmationNumber_key";

-- DropIndex
DROP INDEX "CommercialAccount_sizeId_startDate_endDate_idx";

-- AlterTable
ALTER TABLE "CommercialAccount" DROP COLUMN "confirmationNumber",
DROP COLUMN "endDate",
DROP COLUMN "monthlyRate",
DROP COLUMN "sizeId",
DROP COLUMN "startDate",
DROP COLUMN "termMonths",
ADD COLUMN     "accountNumber" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "CommercialOrder" (
    "id" TEXT NOT NULL,
    "confirmationNumber" TEXT NOT NULL,
    "commercialAccountId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rentalDays" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "outstandingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outstandingNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommercialOrder_confirmationNumber_key" ON "CommercialOrder"("confirmationNumber");

-- CreateIndex
CREATE INDEX "CommercialOrder_sizeId_startDate_endDate_idx" ON "CommercialOrder"("sizeId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "CommercialOrder_commercialAccountId_startDate_idx" ON "CommercialOrder"("commercialAccountId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialAccount_accountNumber_key" ON "CommercialAccount"("accountNumber");

-- AddForeignKey
ALTER TABLE "CommercialOrder" ADD CONSTRAINT "CommercialOrder_commercialAccountId_fkey" FOREIGN KEY ("commercialAccountId") REFERENCES "CommercialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
