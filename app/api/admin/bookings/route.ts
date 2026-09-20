import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeEndDate } from "@/lib/availability";
import { DUMPSTER_SIZES } from "@/lib/pricing";
import { isAdminAuthed } from "@/lib/admin-auth";

function generateConfirmationNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DRZ${Date.now().toString().slice(-6)}${rand}`;
}

const VALID_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];

type ManualBookingBody = {
  sizeId: string;
  deliveryDate: string;
  rentalDays: number;
  price: number;
  status?: string;
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

// Lets the owner add a booking directly from admin — for a customer being
// migrated from wherever they booked before, or a phone/in-person order.
// No payment is collected here; the owner enters whatever price was agreed.
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ManualBookingBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const size = DUMPSTER_SIZES.find((s) => s.id === body.sizeId);
  if (!size) {
    return NextResponse.json({ error: "Unknown dumpster size." }, { status: 400 });
  }

  const startDate = new Date(body.deliveryDate);
  if (Number.isNaN(startDate.getTime()) || !body.rentalDays) {
    return NextResponse.json({ error: "Invalid delivery date or rental duration." }, { status: 400 });
  }
  const endDate = computeEndDate(startDate, body.rentalDays);

  if (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0) {
    return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
  }

  const status = body.status && VALID_STATUSES.includes(body.status) ? body.status : "Confirmed";

  const required: (keyof ManualBookingBody)[] = ["fullName", "email", "phone", "street", "city", "state", "zip"];
  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string") {
      return NextResponse.json({ error: `Missing required field: ${field}.` }, { status: 400 });
    }
  }

  try {
    const booking = await db.$transaction(async (tx) => {
      const [residentialCount, commercialCount] = await Promise.all([
        tx.booking.count({
          where: {
            sizeId: size.id,
            status: { in: ["Pending", "Confirmed"] },
            startDate: { lt: endDate },
            endDate: { gt: startDate },
          },
        }),
        tx.commercialOrder.count({
          where: {
            sizeId: size.id,
            status: { in: ["Pending", "Confirmed"] },
            startDate: { lt: endDate },
            endDate: { gt: startDate },
          },
        }),
      ]);

      if (residentialCount + commercialCount >= size.units && status !== "Cancelled") {
        throw new Error("SOLD_OUT");
      }

      return tx.booking.create({
        data: {
          confirmationNumber: generateConfirmationNumber(),
          sizeId: size.id,
          startDate,
          endDate,
          rentalDays: body.rentalDays,
          price: body.price,
          status,
          fullName: body.fullName.trim(),
          email: body.email.trim(),
          phone: body.phone.trim(),
          street: body.street.trim(),
          city: body.city.trim(),
          state: body.state.trim(),
          zip: body.zip.trim(),
        },
      });
    });

    return NextResponse.json({ confirmationNumber: booking.confirmationNumber });
  } catch (err) {
    if (err instanceof Error && err.message === "SOLD_OUT") {
      return NextResponse.json(
        { error: "That size is already fully booked for those dates. Choose a different date, size, or mark it Cancelled." },
        { status: 409 }
      );
    }
    console.error("Failed to create manual booking:", err);
    return NextResponse.json({ error: "Something went wrong creating the booking." }, { status: 500 });
  }
}
