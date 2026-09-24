import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";

const VALID_STATUSES = ["Active", "Cancelled"];

const STRING_FIELDS = [
  "businessName",
  "contactName",
  "email",
  "phone",
  "street",
  "city",
  "state",
  "zip",
] as const;
type StringField = (typeof STRING_FIELDS)[number];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status: unknown = body?.status;

  const data: Partial<Record<StringField, string>> & { status?: string } = {};

  if (status !== undefined) {
    if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }
    data.status = status;
  }

  for (const field of STRING_FIELDS) {
    const value: unknown = body?.[field];
    if (value === undefined) continue;
    if (typeof value !== "string" || !value.trim()) {
      return NextResponse.json({ error: `${field} can't be empty.` }, { status: 400 });
    }
    data[field] = value.trim();
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const account = await db.commercialAccount.update({ where: { id }, data });
    return NextResponse.json({ account });
  } catch (err) {
    console.error("Failed to update commercial account:", err);
    return NextResponse.json({ error: "Commercial account not found." }, { status: 404 });
  }
}
