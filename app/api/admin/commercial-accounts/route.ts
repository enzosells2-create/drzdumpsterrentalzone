import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { commercialAccountWelcomeEmail, sendEmail } from "@/lib/email";

function generateAccountNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DRZ-BIZ-${Date.now().toString().slice(-6)}${rand}`;
}

type ManualCommercialAccountBody = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

// Lets the owner set up a commercial account directly from admin — for a
// business being migrated over, without them filling out the public signup
// form themselves. No signature/checkbox here since the owner is entering
// it on the business's behalf; the account still works the same afterward.
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ManualCommercialAccountBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const required: (keyof ManualCommercialAccountBody)[] = [
    "businessName",
    "contactName",
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
        signature: "Added by admin",
      },
    });

    // Best-effort — the account is already created either way.
    const welcome = commercialAccountWelcomeEmail({
      businessName: account.businessName,
      contactName: account.contactName,
      accountNumber: account.accountNumber,
    });
    await sendEmail({ to: account.email, ...welcome });

    return NextResponse.json({ accountNumber: account.accountNumber });
  } catch (err) {
    console.error("Failed to create manual commercial account:", err);
    return NextResponse.json({ error: "Something went wrong creating the account." }, { status: 500 });
  }
}
