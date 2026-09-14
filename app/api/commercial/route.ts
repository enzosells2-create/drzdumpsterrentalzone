import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DUMPSTER_SIZES } from "@/lib/pricing";
import { calculateCommercialMonthlyRate, COMMERCIAL_TERM_OPTIONS } from "@/lib/commercial";
import { isAdminAuthed } from "@/lib/admin-auth";

function generateConfirmationNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DRZC${Date.now().toString().slice(-6)}${rand}`;
}

type CreateCommercialBody = {
  sizeId: string;
  startDate: string;
  termMonths: number;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  signature: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as CreateCommercialBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const size = DUMPSTER_SIZES.find((s) => s.id === body.sizeId);
  if (!size) {
    return NextResponse.json({ error: "Unknown dumpster size." }, { status: 400 });
  }

  const validTerm = COMMERCIAL_TERM_OPTIONS.some((o) => o.months === body.termMonths);
  if (!validTerm) {
    return NextResponse.json(
      { error: `termMonths must be one of: ${COMMERCIAL_TERM_OPTIONS.map((o) => o.months).join(", ")}` },
      { status: 400 }
    );
  }

  const startDate = new Date(body.startDate);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Invalid start date." }, { status: 400 });
  }
  // Month-based term, not day-based — 3 months means +3 calendar months, not
  // a fixed day count (unlike residential's day-based rentalDays).
  const endDate = new Date(
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + body.termMonths, startDate.getUTCDate())
  );

  const required: (keyof CreateCommercialBody)[] = [
    "businessName",
    "contactName",
    "email",
    "phone",
    "street",
    "city",
    "state",
    "zip",
    "signature",
  ];
  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string") {
      return NextResponse.json({ error: `Missing required field: ${field}.` }, { status: 400 });
    }
  }

  const monthlyRate = calculateCommercialMonthlyRate(size);

  try {
    const account = await db.$transaction(async (tx) => {
      // Same shared inventory pool as residential — see lib/commercial.ts.
      const [residentialCount, commercialCount] = await Promise.all([
        tx.booking.count({
          where: {
            sizeId: size.id,
            status: { in: ["Pending", "Confirmed"] },
            startDate: { lt: endDate },
            endDate: { gt: startDate },
          },
        }),
        tx.commercialAccount.count({
          where: {
            sizeId: size.id,
            status: "Active",
            startDate: { lt: endDate },
            endDate: { gt: startDate },
          },
        }),
      ]);

      if (residentialCount + commercialCount >= size.units) {
        throw new Error("SOLD_OUT");
      }

      return tx.commercialAccount.create({
        data: {
          confirmationNumber: generateConfirmationNumber(),
          sizeId: size.id,
          startDate,
          endDate,
          termMonths: body.termMonths,
          monthlyRate,
          businessName: body.businessName,
          contactName: body.contactName,
          email: body.email,
          phone: body.phone,
          street: body.street,
          city: body.city,
          state: body.state,
          zip: body.zip,
          signature: body.signature,
        },
      });
    });

    return NextResponse.json({
      confirmationNumber: account.confirmationNumber,
      monthlyRate: account.monthlyRate,
      termMonths: account.termMonths,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SOLD_OUT") {
      return NextResponse.json(
        {
          error:
            "That size isn't available for the term you selected — every unit is already committed. Please choose a different size or contact us directly.",
        },
        { status: 409 }
      );
    }
    console.error("Failed to create commercial account:", err);
    return NextResponse.json({ error: "Something went wrong creating the commercial account." }, { status: 500 });
  }
}

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accounts = await db.commercialAccount.findMany({ orderBy: { startDate: "asc" } });
  return NextResponse.json({ accounts });
}
