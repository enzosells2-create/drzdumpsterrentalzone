import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { DUMPSTER_SIZES } from "@/lib/pricing";
import AdminBookingsTable from "./AdminBookingsTable";

export default async function AdminPage() {
  const authed = await isAdminAuthed();
  if (!authed) redirect("/admin/login");

  const bookings = await db.booking.findMany({ orderBy: { startDate: "asc" } });

  const serialized = bookings.map((b) => ({
    id: b.id,
    confirmationNumber: b.confirmationNumber,
    sizeId: b.sizeId,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    rentalDays: b.rentalDays,
    price: b.price,
    status: b.status,
    fullName: b.fullName,
    email: b.email,
    phone: b.phone,
    street: b.street,
    city: b.city,
    state: b.state,
    zip: b.zip,
    pinLat: b.pinLat,
    pinLng: b.pinLng,
    cardBrand: b.cardBrand,
    cardLast4: b.cardLast4,
    promoCode: b.promoCode,
    discountAmount: b.discountAmount,
    deliveredAt: b.deliveredAt ? b.deliveredAt.toISOString() : null,
    pickedUpAt: b.pickedUpAt ? b.pickedUpAt.toISOString() : null,
    thankYouSentAt: b.thankYouSentAt ? b.thankYouSentAt.toISOString() : null,
    outstandingBalance: b.outstandingBalance,
    outstandingNote: b.outstandingNote,
    createdAt: b.createdAt.toISOString(),
  }));

  return <AdminBookingsTable initialBookings={serialized} sizes={DUMPSTER_SIZES} />;
}
