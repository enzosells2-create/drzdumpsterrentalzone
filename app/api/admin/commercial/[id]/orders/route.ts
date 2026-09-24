import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeEndDate } from "@/lib/availability";
import { DUMPSTER_SIZES } from "@/lib/pricing";
import { calculateCommercialPrice } from "@/lib/commercial";
import { isAdminAuthed } from "@/lib/admin-auth";
import { newCommercialOrderOwnerEmail, notifyOwner } from "@/lib/email";

function generateConfirmationNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DRZC${Date.now().toString().slice(-6)}${rand}`;
}

type CreateOrderBody = {
  sizeId: string;
  deliveryDate: string;
  rentalDays: number;
  street: string;
  city: string;
  state: string;
  zip: string;
};

// Lets the owner place an order directly under an existing commercial
// account — for a business that doesn't want to place it themselves through
// /commercial/order. Same pricing/inventory rules as the self-serve flow,
// just scoped by account id instead of a typed-in account number.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as CreateOrderBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const account = await db.commercialAccount.findUnique({ where: { id } });
  if (!account) {
    return NextResponse.json({ error: "Commercial account not found." }, { status: 404 });
  }
  if (account.status !== "Active") {
    return NextResponse.json({ error: "This commercial account isn't Active." }, { status: 400 });
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

  const required: (keyof CreateOrderBody)[] = ["street", "city", "state", "zip"];
  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string") {
      return NextResponse.json({ error: `Missing required field: ${field}.` }, { status: 400 });
    }
  }

  const price = calculateCommercialPrice(size, body.rentalDays);

  try {
    const order = await db.$transaction(async (tx) => {
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

      if (residentialCount + commercialCount >= size.units) {
        throw new Error("SOLD_OUT");
      }

      return tx.commercialOrder.create({
        data: {
          confirmationNumber: generateConfirmationNumber(),
          commercialAccountId: account.id,
          sizeId: size.id,
          startDate,
          endDate,
          rentalDays: body.rentalDays,
          price,
          street: body.street.trim(),
          city: body.city.trim(),
          state: body.state.trim(),
          zip: body.zip.trim(),
        },
      });
    });

    // Best-effort — the order is already created either way.
    const notice = newCommercialOrderOwnerEmail({
      confirmationNumber: order.confirmationNumber,
      sizeLabel: size.label,
      businessName: account.businessName,
      accountNumber: account.accountNumber,
      address: `${order.street}, ${order.city}, ${order.state} ${order.zip}`,
      deliveryDate: order.startDate.toISOString().split("T")[0],
      price: order.price,
    });
    await notifyOwner(
      notice,
      `New DRZ commercial order: ${size.label} - ${account.businessName} - $${order.price.toFixed(2)} - delivers ${order.startDate.toISOString().split("T")[0]}`
    );

    return NextResponse.json({
      id: order.id,
      confirmationNumber: order.confirmationNumber,
      sizeId: order.sizeId,
      startDate: order.startDate.toISOString(),
      endDate: order.endDate.toISOString(),
      rentalDays: order.rentalDays,
      price: order.price,
      status: order.status,
      street: order.street,
      city: order.city,
      state: order.state,
      zip: order.zip,
      unitNumber: order.unitNumber,
      outstandingBalance: order.outstandingBalance,
      outstandingNote: order.outstandingNote,
      invoicedAt: null,
      createdAt: order.createdAt.toISOString(),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SOLD_OUT") {
      return NextResponse.json(
        {
          error:
            "That size isn't available for those dates — every unit is already reserved. Please choose a different date or size.",
        },
        { status: 409 }
      );
    }
    console.error("Failed to create commercial order:", err);
    return NextResponse.json({ error: "Something went wrong creating the order." }, { status: 500 });
  }
}
