import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const codes = await db.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ codes });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawCode: unknown = body?.code;
  const rawPercent: unknown = body?.discountPercent;
  const rawExpiresAt: unknown = body?.expiresAt;

  if (typeof rawCode !== "string" || !rawCode.trim()) {
    return NextResponse.json({ error: "Code is required." }, { status: 400 });
  }
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,20}$/.test(code)) {
    return NextResponse.json(
      { error: "Code must be 3-20 characters: letters, numbers, or hyphens." },
      { status: 400 }
    );
  }

  const discountPercent = rawPercent === undefined || rawPercent === null || rawPercent === "" ? 15 : Number(rawPercent);
  if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
    return NextResponse.json({ error: "Discount percent must be between 1 and 100." }, { status: 400 });
  }

  let expiresAt: Date | null = null;
  if (typeof rawExpiresAt === "string" && rawExpiresAt.trim()) {
    const parsed = new Date(rawExpiresAt);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid expiration date." }, { status: 400 });
    }
    expiresAt = parsed;
  }

  try {
    const promo = await db.promoCode.create({
      data: { code, discountPercent, expiresAt },
    });
    return NextResponse.json({ code: promo }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "That code already exists." }, { status: 409 });
    }
    console.error("Failed to create promo code:", err);
    return NextResponse.json({ error: "Something went wrong creating the code." }, { status: 500 });
  }
}
