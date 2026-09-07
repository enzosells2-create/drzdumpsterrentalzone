import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";

const VALID_STATUSES = ["New", "Read", "Resolved"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status: unknown = body?.status;

  if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  try {
    const message = await db.contactMessage.update({ where: { id }, data: { status } });
    return NextResponse.json({ message });
  } catch (err) {
    console.error("Failed to update message:", err);
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }
}
