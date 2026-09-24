import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe-server";
import { invoicePaidOwnerEmail, notifyOwner } from "@/lib/email";

// Stripe sends this whenever a commercial-invoice Checkout Session (created
// in /api/admin/commercial/[id]/invoice) completes, so the owner finds out
// the moment an invoice is actually paid — separate from the "invoice sent"
// notification the admin already sees when they click Send Invoice.
// Doesn't touch outstandingBalance; that stays a manual admin action.
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.type === "commercial_invoice" && session.payment_status === "paid") {
      const businessName = session.metadata.businessName || "A commercial customer";
      const amount = (session.amount_total ?? 0) / 100;
      const notice = invoicePaidOwnerEmail({ businessName, amount });
      await notifyOwner(notice, `DRZ invoice paid: ${businessName} - $${amount.toFixed(2)}`);
    }
  }

  return NextResponse.json({ received: true });
}
