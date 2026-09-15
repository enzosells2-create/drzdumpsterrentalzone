import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setCommercialSession } from "@/lib/commercial-auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const accountNumber = body?.accountNumber;
  if (typeof accountNumber !== "string" || !accountNumber.trim()) {
    return NextResponse.json({ error: "Enter your commercial account number." }, { status: 400 });
  }

  const account = await db.commercialAccount.findUnique({
    where: { accountNumber: accountNumber.trim().toUpperCase() },
  });
  if (!account) {
    return NextResponse.json(
      { error: "We couldn't find a commercial account with that number." },
      { status: 404 }
    );
  }

  await setCommercialSession(account.id);
  return NextResponse.json({ businessName: account.businessName });
}
