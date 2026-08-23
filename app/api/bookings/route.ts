import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeEndDate } from "@/lib/availability";
import { calculatePrice, DUMPSTER_SIZES } from "@/lib/pricing";
import { isAdminAuthed } from "@/lib/admin-auth";
import { roundToCents } from "@/lib/promo";

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
  promoCode: string | null;
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

  // Base price is always recomputed server-side from the size + duration —
  // never trust the client's number for what actually gets charged.
  const basePrice = calculatePrice(size, body.rentalDays);

  try {
    // Wrapped in a transaction so the "is a unit free?" check, the promo
    // code re-check, and the reservation itself all happen atomically — two
    // customers racing for the last unit (or a code getting deactivated
    // mid-checkout) can't produce an inconsistent booking.
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

      let promoCode: string | null = null;
      let discountAmount: number | null = null;

      if (body.promoCode) {
        const code = body.promoCode.trim().toUpperCase();
        const promo = await tx.promoCode.findUnique({ where: { code } });
        const validNow =
          promo && promo.active && (!promo.expiresAt || promo.expiresAt.getTime() >= Date.now());

        if (!validNow) {
          throw new Error("PROMO_INVALID");
        }

        promoCode = promo.code;
        discountAmount = roundToCents(basePrice * (promo.discountPercent / 100));
        await tx.promoCode.update({
          where: { id: promo.id },
          data: { timesUsed: { increment: 1 } },
        });
      }

      const finalPrice = roundToCents(basePrice - (discountAmount ?? 0));

      return tx.booking.create({
        data: {
          confirmationNumber: generateConfirmationNumber(),
          sizeId: size.id,
          startDate,
          endDate,
          rentalDays: body.rentalDays,
          price: finalPrice,
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
          promoCode,
          discountAmount,
        },
      });
    });

    return NextResponse.json({
      confirmationNumber: booking.confirmationNumber,
      price: booking.price,
      discountAmount: booking.discountAmount,
    });
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
    if (err instanceof Error && err.message === "PROMO_INVALID") {
      return NextResponse.json(
        { error: "That promo code is no longer valid. Please remove it and try again." },
        { status: 400 }
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
