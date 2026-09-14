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

type CreateCommercialOrderBody = {
  accountNumber: string;
  sizeId: string;
  deliveryDate: string;
  rentalDays: number;
  street: string;
  city: string;
  state: string;
  zip: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as CreateCommercialOrderBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.accountNumber || typeof body.accountNumber !== "string") {
    return NextResponse.json({ error: "Missing commercial account number." }, { status: 400 });
  }
  const account = await db.commercialAccount.findUnique({ where: { accountNumber: body.accountNumber.trim() } });
  if (!account) {
    return NextResponse.json({ error: "We couldn't find a commercial account with that number." }, { status: 404 });
  }
  if (account.status !== "Active") {
    return NextResponse.json({ error: "This commercial account is not active." }, { status: 400 });
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

  const required: (keyof CreateCommercialOrderBody)[] = ["street", "city", "state", "zip"];
  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string") {
      return NextResponse.json({ error: `Missing required field: ${field}.` }, { status: 400 });
    }
  }

  const price = calculateCommercialPrice(size, body.rentalDays);

  try {
    const order = await db.$transaction(async (tx) => {
      // Same shared inventory pool as residential.
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

    return NextResponse.json({ confirmationNumber: order.confirmationNumber, price: order.price });
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

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orders = await db.commercialOrder.findMany({
    orderBy: { startDate: "asc" },
    include: { commercialAccount: true },
  });
  return NextResponse.json({ orders });
}
