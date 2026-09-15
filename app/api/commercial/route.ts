import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { commercialAccountWelcomeEmail, newCommercialAccountOwnerEmail, notifyOwner, sendEmail } from "@/lib/email";
import { setCommercialSession } from "@/lib/commercial-auth";

function generateAccountNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DRZ-BIZ-${Date.now().toString().slice(-6)}${rand}`;
}

type CreateCommercialAccountBody = {
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

// Signs up a new commercial account — the ongoing agreement itself. No
// size, dates, or payment involved here; the business places individual
// orders under this account afterward (see /api/commercial/orders).
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as CreateCommercialAccountBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const required: (keyof CreateCommercialAccountBody)[] = [
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

  try {
    const account = await db.commercialAccount.create({
      data: {
        accountNumber: generateAccountNumber(),
        businessName: body.businessName.trim(),
        contactName: body.contactName.trim(),
        email: body.email.trim(),
        phone: body.phone.trim(),
        street: body.street.trim(),
        city: body.city.trim(),
        state: body.state.trim(),
        zip: body.zip.trim(),
        signature: body.signature.trim(),
      },
    });

    // Best-effort — the account is already created either way.
    const notice = newCommercialAccountOwnerEmail({
      accountNumber: account.accountNumber,
      businessName: account.businessName,
      contactName: account.contactName,
      email: account.email,
      phone: account.phone,
    });
    await notifyOwner(notice, `New DRZ commercial account: ${account.businessName} (${account.accountNumber})`);

    // Email the new business their account number/login code at the address
    // they just gave us. Best-effort — the account is already created and
    // shown on-screen either way.
    const welcome = commercialAccountWelcomeEmail({
      businessName: account.businessName,
      contactName: account.contactName,
      accountNumber: account.accountNumber,
    });
    await sendEmail({ to: account.email, ...welcome });

    // Log the new business straight into their portal — no need to re-enter
    // the account number they were just given.
    await setCommercialSession(account.id);

    return NextResponse.json({ accountNumber: account.accountNumber });
  } catch (err) {
    console.error("Failed to create commercial account:", err);
    return NextResponse.json({ error: "Something went wrong creating the commercial account." }, { status: 500 });
  }
}

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accounts = await db.commercialAccount.findMany({
    orderBy: { createdAt: "desc" },
    include: { orders: true },
  });
  return NextResponse.json({ accounts });
}
