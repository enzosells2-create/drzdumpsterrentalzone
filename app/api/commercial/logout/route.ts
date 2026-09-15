import { NextResponse } from "next/server";
import { clearCommercialSession } from "@/lib/commercial-auth";

export async function POST() {
  await clearCommercialSession();
  return NextResponse.json({ ok: true });
}
