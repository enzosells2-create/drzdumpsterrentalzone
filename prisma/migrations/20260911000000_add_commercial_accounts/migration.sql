-- CreateTable
CREATE TABLE "CommercialAccount" (
    "id" TEXT NOT NULL,
    "confirmationNumber" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "monthlyRate" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "businessName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommercialAccount_confirmationNumber_key" ON "CommercialAccount"("confirmationNumber");

-- CreateIndex
CREATE INDEX "CommercialAccount_sizeId_startDate_endDate_idx" ON "CommercialAccount"("sizeId", "startDate", "endDate");
