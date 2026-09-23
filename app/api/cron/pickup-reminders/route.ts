import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ACTIVE_STATUSES } from "@/lib/availability";
import { DUMPSTER_SIZES } from "@/lib/pricing";
import { notifyOwner, pickupReadyOwnerEmail } from "@/lib/email";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function sizeLabel(sizeId: string): string {
  return DUMPSTER_SIZES.find((s) => s.id === sizeId)?.label ?? sizeId;
}

/**
 * Runs daily (see vercel.json) and emails/texts the owner about every
 * active rental whose end date has arrived — i.e. ready to be picked up.
 * `pickupReminderSentAt` makes each booking/order only trigger this once,
 * regardless of how many times the cron fires after that.
 */
export async function GET(request: NextRequest) {
  // Vercel Cron sends this automatically when CRON_SECRET is set; blocks
  // anyone else from triggering (and re-triggering) these notifications by
  // just hitting the URL.
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  let notified = 0;

  const dueBookings = await db.booking.findMany({
    where: {
      status: { in: [...ACTIVE_STATUSES] },
      pickedUpAt: null,
      pickupReminderSentAt: null,
      endDate: { lte: now },
    },
  });

  for (const b of dueBookings) {
    const notice = pickupReadyOwnerEmail({
      confirmationNumber: b.confirmationNumber,
      sizeLabel: sizeLabel(b.sizeId),
      name: b.fullName,
      phone: b.phone,
      address: `${b.street}, ${b.city}, ${b.state} ${b.zip}`,
      endDate: formatDate(b.endDate),
      commercial: false,
    });
    await notifyOwner(
      notice,
      `DRZ pickup ready: ${sizeLabel(b.sizeId)} - ${b.fullName} - ${b.street}, ${b.city} - ${b.confirmationNumber}`
    );
    await db.booking.update({ where: { id: b.id }, data: { pickupReminderSentAt: now } });
    notified += 1;
  }

  const dueOrders = await db.commercialOrder.findMany({
    where: {
      status: { in: [...ACTIVE_STATUSES] },
      pickupReminderSentAt: null,
      endDate: { lte: now },
    },
    include: { commercialAccount: true },
  });

  for (const o of dueOrders) {
    const notice = pickupReadyOwnerEmail({
      confirmationNumber: o.confirmationNumber,
      sizeLabel: sizeLabel(o.sizeId),
      name: o.commercialAccount.businessName,
      phone: o.commercialAccount.phone,
      address: `${o.street}, ${o.city}, ${o.state} ${o.zip}`,
      endDate: formatDate(o.endDate),
      commercial: true,
    });
    await notifyOwner(
      notice,
      `DRZ pickup ready: ${sizeLabel(o.sizeId)} - ${o.commercialAccount.businessName} - ${o.street}, ${o.city} - ${o.confirmationNumber}`
    );
    await db.commercialOrder.update({ where: { id: o.id }, data: { pickupReminderSentAt: now } });
    notified += 1;
  }

  return NextResponse.json({ notified });
}
