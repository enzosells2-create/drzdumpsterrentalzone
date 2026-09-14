import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";

// Used to record the "didn't hit 3 orders this month" penalty — the price
// difference up to full residential rate — as well as any other overage.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const outstandingBalance: unknown = body?.outstandingBalance;
  const outstandingNote: unknown = body?.outstandingNote;

  if (typeof outstandingBalance !== "number" || !Number.isFinite(outstandingBalance) || outstandingBalance < 0) {
    return NextResponse.json({ error: "outstandingBalance must be a non-negative number." }, { status: 400 });
  }
  if (outstandingNote !== undefined && outstandingNote !== null && typeof outstandingNote !== "string") {
    return NextResponse.json({ error: "outstandingNote must be a string." }, { status: 400 });
  }

  try {
    const order = await db.commercialOrder.update({
      where: { id },
      data: {
        outstandingBalance,
        outstandingNote: typeof outstandingNote === "string" ? outstandingNote.trim() || null : null,
      },
    });
    return NextResponse.json({ order });
  } catch (err) {
    console.error("Failed to update commercial order balance:", err);
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
}
