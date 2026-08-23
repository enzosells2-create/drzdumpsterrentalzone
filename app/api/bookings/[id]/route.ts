import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";

const VALID_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status: unknown = body?.status;

  if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const booking = await db.booking.update({ where: { id }, data: { status } });
    return NextResponse.json({ booking });
  } catch (err) {
    console.error("Failed to update booking:", err);
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
}
