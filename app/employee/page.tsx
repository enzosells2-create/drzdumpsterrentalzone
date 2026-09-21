import { redirect } from "next/navigation";
import { isEmployeeAuthed } from "@/lib/employee-auth";
import { ACTIVE_STATUSES } from "@/lib/availability";
import { db } from "@/lib/db";
import EmployeeSchedule from "./EmployeeSchedule";

export const metadata = {
  title: "Delivery Schedule | DRZ Dumpster Rental",
};

export type ScheduleEvent = {
  date: string; // ISO
  type: "Delivery" | "Pickup";
  sizeId: string;
  unitNumber: number | null;
  address: string;
  commercial: boolean;
};

export default async function EmployeePage() {
  const authed = await isEmployeeAuthed();
  if (!authed) redirect("/employee/login");

  const [bookings, orders] = await Promise.all([
    db.booking.findMany({
      where: { status: { in: [...ACTIVE_STATUSES] } },
      select: {
        sizeId: true,
        startDate: true,
        endDate: true,
        street: true,
        city: true,
        state: true,
        zip: true,
        unitNumber: true,
        deliveredAt: true,
        pickedUpAt: true,
      },
    }),
    db.commercialOrder.findMany({
      where: { status: { in: [...ACTIVE_STATUSES] } },
      select: {
        sizeId: true,
        startDate: true,
        endDate: true,
        street: true,
        city: true,
        state: true,
        zip: true,
        unitNumber: true,
      },
    }),
  ]);

  const events: ScheduleEvent[] = [];

  for (const b of bookings) {
    const address = `${b.street}, ${b.city}, ${b.state} ${b.zip}`;
    if (!b.deliveredAt) {
      events.push({
        date: b.startDate.toISOString(),
        type: "Delivery",
        sizeId: b.sizeId,
        unitNumber: b.unitNumber,
        address,
        commercial: false,
      });
    }
    if (!b.pickedUpAt) {
      events.push({
        date: b.endDate.toISOString(),
        type: "Pickup",
        sizeId: b.sizeId,
        unitNumber: b.unitNumber,
        address,
        commercial: false,
      });
    }
  }

  for (const o of orders) {
    const address = `${o.street}, ${o.city}, ${o.state} ${o.zip}`;
    // CommercialOrder has no granular deliveredAt/pickedUpAt — status alone
    // (already filtered to Pending/Confirmed above) tells us both events
    // still need to happen.
    events.push({
      date: o.startDate.toISOString(),
      type: "Delivery",
      sizeId: o.sizeId,
      unitNumber: o.unitNumber,
      address,
      commercial: true,
    });
    events.push({
      date: o.endDate.toISOString(),
      type: "Pickup",
      sizeId: o.sizeId,
      unitNumber: o.unitNumber,
      address,
      commercial: true,
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));

  return <EmployeeSchedule events={events} />;
}
