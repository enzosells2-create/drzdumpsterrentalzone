import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-server";

// After stripe.confirmPayment() succeeds client-side, the browser never sees
// the card's brand/last4 directly (Stripe Elements keeps raw card data in
// its own iframe for PCI compliance) — this looks it up server-side so it
// can be shown on the confirmation page and stored with the booking.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const paymentIntentId = body?.paymentIntentId;
  if (typeof paymentIntentId !== "string") {
    return NextResponse.json({ error: "Missing paymentIntentId." }, { status: 400 });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["payment_method"],
    });

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "That payment hasn't succeeded." }, { status: 400 });
    }

    const paymentMethod = paymentIntent.payment_method;
    const card = typeof paymentMethod === "object" && paymentMethod ? paymentMethod.card : undefined;

    return NextResponse.json({
      status: paymentIntent.status,
      brand: card?.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : "Card",
      last4: card?.last4 ?? "",
    });
  } catch (err) {
    console.error("Failed to look up payment details:", err);
    return NextResponse.json({ error: "Couldn't look up that payment." }, { status: 500 });
  }
}
