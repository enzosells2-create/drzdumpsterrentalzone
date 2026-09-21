import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { ACTIVE_STATUSES } from "@/lib/availability";
import { db } from "@/lib/db";
import AdminMapView, { RentalMarker } from "./AdminMapView";

export const metadata = {
  title: "Dumpster Map | DRZ Admin",
};

export default async function AdminMapPage() {
  const authed = await isAdminAuthed();
  if (!authed) redirect("/admin/login");

  const [bookings, orders] = await Promise.all([
    db.booking.findMany({
      where: { status: { in: [...ACTIVE_STATUSES] } },
      select: {
        id: true,
        confirmationNumber: true,
        sizeId: true,
        fullName: true,
        phone: true,
        street: true,
        city: true,
        state: true,
        zip: true,
        pinLat: true,
        pinLng: true,
        unitNumber: true,
        startDate: true,
        endDate: true,
        status: true,
      },
      orderBy: { startDate: "asc" },
    }),
    db.commercialOrder.findMany({
      where: { status: { in: [...ACTIVE_STATUSES] } },
      select: {
        id: true,
        confirmationNumber: true,
        sizeId: true,
        street: true,
        city: true,
        state: true,
        zip: true,
        unitNumber: true,
        startDate: true,
        endDate: true,
        status: true,
        commercialAccount: { select: { businessName: true, phone: true } },
      },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const markers: RentalMarker[] = [
    ...bookings.map((b) => ({
      id: b.id,
      confirmationNumber: b.confirmationNumber,
      sizeId: b.sizeId,
      name: b.fullName,
      phone: b.phone,
      street: b.street,
      city: b.city,
      state: b.state,
      zip: b.zip,
      pinLat: b.pinLat,
      pinLng: b.pinLng,
      unitNumber: b.unitNumber,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
      status: b.status,
      commercial: false,
    })),
    ...orders.map((o) => ({
      id: o.id,
      confirmationNumber: o.confirmationNumber,
      sizeId: o.sizeId,
      name: o.commercialAccount.businessName,
      phone: o.commercialAccount.phone,
      street: o.street,
      city: o.city,
      state: o.state,
      zip: o.zip,
      pinLat: null,
      pinLng: null,
      unitNumber: o.unitNumber,
      startDate: o.startDate.toISOString(),
      endDate: o.endDate.toISOString(),
      status: o.status,
      commercial: true,
    })),
  ];

  return <AdminMapView markers={markers} />;
}
