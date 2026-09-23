-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "pickupReminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CommercialOrder" ADD COLUMN     "pickupReminderSentAt" TIMESTAMP(3);
