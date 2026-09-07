import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeEndDate } from "@/lib/availability";
import { DUMPSTER_SIZES } from "@/lib/pricing";
import { isAdminAuthed } from "@/lib/admin-auth";
import { stripe } from "@/lib/stripe-server";
import { newBookingOwnerEmail, OWNER_EMAIL, sendEmail } from "@/lib/email";

function generateConfirmationNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DRZ${Date.now().toString().slice(-6)}${rand}`;
}

type CreateBookingBody = {
  sizeId: string;
  deliveryDate: string;
  rentalDays: number;
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  pinLat: number | null;
  pinLng: number | null;
  stripePaymentIntentId: string;
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

  if (!body.stripePaymentIntentId || typeof body.stripePaymentIntentId !== "string") {
    return NextResponse.json({ error: "Missing payment confirmation." }, { status: 400 });
  }

  // The PaymentIntent — not anything the browser sends — is the source of
  // truth for what was actually charged and for what. We set all of this in
  // its metadata ourselves when creating/updating it (see
  // /api/stripe/payment-intent), so once Stripe confirms the charge
  // succeeded, we trust that metadata rather than recomputing pricing here.
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(body.stripePaymentIntentId, {
      expand: ["payment_method"],
    });
  } catch (err) {
    console.error("Failed to retrieve PaymentIntent:", err);
    return NextResponse.json({ error: "Couldn't verify that payment." }, { status: 400 });
  }

  if (paymentIntent.status !== "succeeded") {
    return NextResponse.json({ error: "Payment has not been completed." }, { status: 400 });
  }
  if (paymentIntent.metadata.sizeId !== body.sizeId || paymentIntent.metadata.rentalDays !== String(body.rentalDays)) {
    return NextResponse.json(
      { error: "This payment doesn't match the requested booking." },
      { status: 400 }
    );
  }

  const finalPrice = Number(paymentIntent.metadata.subtotal); // pre-tax amount stored on the booking, matching existing convention
  const promoCode = paymentIntent.metadata.promoCode || null;
  const discountAmount = paymentIntent.metadata.discountAmount
    ? Number(paymentIntent.metadata.discountAmount)
    : null;

  const paymentMethod = paymentIntent.payment_method;
  const card = typeof paymentMethod === "object" && paymentMethod ? paymentMethod.card : undefined;
  const cardBrand = card?.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : null;
  const cardLast4 = card?.last4 ?? null;

  try {
    // Wrapped in a transaction so the "is a unit free?" check and the
    // reservation itself happen atomically — two customers racing for the
    // last unit can't both succeed. Payment is already verified above, so
    // this only needs to protect inventory, not re-check pricing.
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

      if (promoCode) {
        // Best-effort usage count — doesn't block booking creation even if
        // the code was since deleted/deactivated, since the customer already
        // paid the discounted price for it.
        await tx.promoCode.updateMany({ where: { code: promoCode }, data: { timesUsed: { increment: 1 } } });
      }

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
          cardBrand,
          cardLast4,
          stripePaymentIntentId: body.stripePaymentIntentId,
          promoCode,
          discountAmount,
        },
      });
    });

    // Best-effort — the booking is already created either way.
    const notice = newBookingOwnerEmail({
      confirmationNumber: booking.confirmationNumber,
      sizeLabel: size.label,
      customerName: booking.fullName,
      phone: booking.phone,
      address: `${booking.street}, ${booking.city}, ${booking.state} ${booking.zip}`,
      deliveryDate: booking.startDate.toISOString().split("T")[0],
      price: booking.price,
    });
    await sendEmail({ to: OWNER_EMAIL, ...notice });

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
            "That size is no longer available for the dates you picked — someone else just booked the last unit. Please choose a different date or size. Your card was not charged again, but contact us to refund the payment you already made.",
        },
        { status: 409 }
      );
    }
    // Reusing a PaymentIntent for a second booking hits the @unique
    // constraint on stripePaymentIntentId.
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "This payment has already been used for a booking." },
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
