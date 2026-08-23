import { NextRequest, NextResponse } from "next/server";
import { validatePromoCode } from "@/lib/promo";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const code = body?.code;
  if (typeof code !== "string") {
    return NextResponse.json({ valid: false, error: "Enter a promo code." }, { status: 400 });
  }

  const result = await validatePromoCode(code);
  if (!result.valid) {
    return NextResponse.json(result, { status: 404 });
  }
  return NextResponse.json(result);
}
