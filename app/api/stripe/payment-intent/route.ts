import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-server";
import { computeCheckoutTotals } from "@/lib/checkout";

type Body = {
  sizeId: unknown;
  rentalDays: unknown;
  promoCode: unknown;
  paymentIntentId?: unknown; // present on PATCH-style updates
};

function parseBody(body: Body | null) {
  if (
    !body ||
    typeof body.sizeId !== "string" ||
    typeof body.rentalDays !== "number" ||
    (body.promoCode !== null && body.promoCode !== undefined && typeof body.promoCode !== "string")
  ) {
    return null;
  }
  return {
    sizeId: body.sizeId,
    rentalDays: body.rentalDays,
    promoCode: (body.promoCode as string | null | undefined) ?? null,
  };
}

// Creates a new PaymentIntent for a size + duration + optional promo code.
// The amount charged is always computed server-side — the browser never
// gets to say how much itself.
export async function POST(request: NextRequest) {
  const raw = (await request.json().catch(() => null)) as Body | null;
  const parsed = parseBody(raw);
  if (!parsed) {
    return NextResponse.json({ error: "Missing or invalid sizeId or rentalDays." }, { status: 400 });
  }

  try {
    const totals = await computeCheckoutTotals(parsed.sizeId, parsed.rentalDays, parsed.promoCode);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totals.total * 100),
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        sizeId: parsed.sizeId,
        rentalDays: String(parsed.rentalDays),
        promoCode: totals.promoCode ?? "",
        basePrice: String(totals.basePrice),
        discountAmount: String(totals.discountAmount),
        subtotal: String(totals.subtotal),
        tax: String(totals.tax),
        total: String(totals.total),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      ...totals,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNKNOWN_SIZE") {
      return NextResponse.json({ error: "Unknown dumpster size." }, { status: 400 });
    }
    if (err instanceof Error && err.message === "PROMO_INVALID") {
      return NextResponse.json({ error: "That promo code isn't valid." }, { status: 400 });
    }
    console.error("Failed to create PaymentIntent:", err);
    return NextResponse.json({ error: "Something went wrong setting up payment." }, { status: 500 });
  }
}

// Re-prices an existing (not-yet-confirmed) PaymentIntent — used when the
// customer applies or removes a promo code after payment setup already
// started, so we don't have to throw away the Stripe Elements session.
export async function PATCH(request: NextRequest) {
  const raw = (await request.json().catch(() => null)) as Body | null;
  const parsed = parseBody(raw);
  const paymentIntentId = raw?.paymentIntentId;
  if (!parsed || typeof paymentIntentId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid sizeId, rentalDays, or paymentIntentId." },
      { status: 400 }
    );
  }

  try {
    const totals = await computeCheckoutTotals(parsed.sizeId, parsed.rentalDays, parsed.promoCode);

    const paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
      amount: Math.round(totals.total * 100),
      metadata: {
        sizeId: parsed.sizeId,
        rentalDays: String(parsed.rentalDays),
        promoCode: totals.promoCode ?? "",
        basePrice: String(totals.basePrice),
        discountAmount: String(totals.discountAmount),
        subtotal: String(totals.subtotal),
        tax: String(totals.tax),
        total: String(totals.total),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      ...totals,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNKNOWN_SIZE") {
      return NextResponse.json({ error: "Unknown dumpster size." }, { status: 400 });
    }
    if (err instanceof Error && err.message === "PROMO_INVALID") {
      return NextResponse.json({ error: "That promo code isn't valid." }, { status: 400 });
    }
    // Most likely cause: the PaymentIntent already moved past a state that
    // allows amount changes (e.g. it's mid-confirmation). Caller should fall
    // back to creating a fresh one via POST.
    console.error("Failed to update PaymentIntent:", err);
    return NextResponse.json({ error: "Couldn't update the payment. Please try again." }, { status: 409 });
  }
}
