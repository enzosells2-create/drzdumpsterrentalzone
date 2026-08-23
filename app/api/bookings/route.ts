import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeEndDate } from "@/lib/availability";
import { DUMPSTER_SIZES } from "@/lib/pricing";
import { isAdminAuthed } from "@/lib/admin-auth";

function generateConfirmationNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DRZ${Date.now().toString().slice(-6)}${rand}`;
}

type CreateBookingBody = {
  sizeId: string;
  deliveryDate: string;
  rentalDays: number;
  price: number;
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  pinLat: number | null;
  pinLng: number | null;
  cardBrand: string | null;
  cardLast4: string | null;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as CreateBookingBody | null;
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

  const required: (keyof CreateBookingBody)[] = [
    "fullName",
    "email",
    "phone",
    "street",
    "city",
    "state",
    "zip",
  ];
  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string") {
      return NextResponse.json({ error: `Missing required field: ${field}.` }, { status: 400 });
    }
  }

  try {
    // Wrapped in a transaction so the "is a unit free?" check and the
    // reservation itself happen atomically — two customers racing for the
    // last unit of a size can't both succeed.
    const booking = await db.$transaction(async (tx) => {
      const overlapping = await tx.booking.count({
        where: {
          sizeId: size.id,
          status: { in: ["Pending", "Confirmed"] },
          startDate: { lt: endDate },
          endDate: { gt: startDate },
        },
      });

      if (overlapping >= size.units) {
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
          fullName: body.fullName,
          email: body.email,
          phone: body.phone,
          street: body.street,
          city: body.city,
          state: body.state,
          zip: body.zip,
          pinLat: body.pinLat ?? null,
          pinLng: body.pinLng ?? null,
          cardBrand: body.cardBrand ?? null,
          cardLast4: body.cardLast4 ?? null,
        },
      });
    });

    return NextResponse.json({ confirmationNumber: booking.confirmationNumber });
  } catch (err) {
    if (err instanceof Error && err.message === "SOLD_OUT") {
      return NextResponse.json(
        {
          error:
            "That size is no longer available for the dates you picked — someone else just booked the last unit. Please choose a different date or size.",
        },
        { status: 409 }
      );
    }
    console.error("Failed to create booking:", err);
    return NextResponse.json({ error: "Something went wrong creating the booking." }, { status: 500 });
  }
}

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const bookings = await db.booking.findMany({ orderBy: { startDate: "asc" } });
  return NextResponse.json({ bookings });
}
