import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { DUMPSTER_SIZES } from "@/lib/pricing";
import { commercialInvoiceEmail, InvoiceLineItem, sendEmail } from "@/lib/email";
import { stripe } from "@/lib/stripe-server";

const SITE_URL = "https://drzdumpsterentalzone.com";

function sizeLabel(sizeId: string): string {
  return DUMPSTER_SIZES.find((s) => s.id === sizeId)?.label ?? sizeId;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

// Manually triggered by the owner — bundles the selected orders (plus any
// outstanding balance on each) into one invoice email to the account, and
// marks those orders invoiced. Doesn't touch outstandingBalance itself or
// take any payment; Net 30 is settled outside the site.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const orderIds: unknown = body?.orderIds;
  if (!Array.isArray(orderIds) || orderIds.length === 0 || !orderIds.every((x) => typeof x === "string")) {
    return NextResponse.json({ error: "Select at least one order to invoice." }, { status: 400 });
  }

  const account = await db.commercialAccount.findUnique({ where: { id } });
  if (!account) {
    return NextResponse.json({ error: "Commercial account not found." }, { status: 404 });
  }

  const orders = await db.commercialOrder.findMany({
    where: { id: { in: orderIds }, commercialAccountId: id },
  });
  if (orders.length === 0) {
    return NextResponse.json({ error: "No matching orders found." }, { status: 404 });
  }

  const orderItems: InvoiceLineItem[] = orders.map((o) => ({
    confirmationNumber: o.confirmationNumber,
    sizeLabel: sizeLabel(o.sizeId),
    date: formatDate(o.startDate),
    amount: o.price,
  }));

  const extraItems: InvoiceLineItem[] = orders
    .filter((o) => o.outstandingBalance > 0)
    .map((o) => ({
      confirmationNumber: o.confirmationNumber,
      sizeLabel: "Additional charge",
      date: formatDate(o.startDate),
      amount: o.outstandingBalance,
      note: o.outstandingNote ?? undefined,
    }));

  const total =
    orderItems.reduce((sum, i) => sum + i.amount, 0) + extraItems.reduce((sum, i) => sum + i.amount, 0);
  const invoiceDate = formatDate(new Date());

  // Best-effort — a Stripe hiccup shouldn't block sending the invoice itself,
  // it just means that one goes out without a "Pay by Card" button.
  let payUrl: string | undefined;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `DRZ Invoice — ${account.businessName} — ${invoiceDate}` },
            unit_amount: Math.round(total * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: account.email,
      metadata: {
        type: "commercial_invoice",
        commercialAccountId: account.id,
        businessName: account.businessName,
        orderIds: orders.map((o) => o.id).join(","),
      },
      success_url: `${SITE_URL}/commercial/invoice-paid?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/commercial`,
    });
    payUrl = session.url ?? undefined;
  } catch (err) {
    console.error("Failed to create Stripe Checkout session for invoice:", err);
  }

  const notice = commercialInvoiceEmail({
    businessName: account.businessName,
    contactName: account.contactName,
    accountNumber: account.accountNumber,
    invoiceDate,
    orderItems,
    extraItems,
    total,
    payUrl,
  });

  const sent = await sendEmail({ to: account.email, ...notice });
  if (!sent) {
    return NextResponse.json({ error: "Couldn't send the invoice email. Please try again." }, { status: 500 });
  }

  const invoicedAt = new Date();
  await db.commercialOrder.updateMany({
    where: { id: { in: orders.map((o) => o.id) } },
    data: { invoicedAt },
  });

  return NextResponse.json({
    total,
    invoiceDate,
    sentTo: account.email,
    invoicedOrderIds: orders.map((o) => o.id),
    invoicedAt: invoicedAt.toISOString(),
  });
}
