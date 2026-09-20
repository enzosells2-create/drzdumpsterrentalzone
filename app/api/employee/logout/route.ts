import { NextResponse } from "next/server";
import { clearEmployeeSession } from "@/lib/employee-auth";

export async function POST() {
  await clearEmployeeSession();
  return NextResponse.json({ ok: true });
}
