import { NextRequest, NextResponse } from "next/server";
import { checkEmployeePassword, setEmployeeSession } from "@/lib/employee-auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password: unknown = body?.password;

  if (!process.env.EMPLOYEE_PASSWORD) {
    return NextResponse.json(
      { error: "EMPLOYEE_PASSWORD is not set on the server yet — add it to .env.local." },
      { status: 500 }
    );
  }

  if (typeof password !== "string" || !(await checkEmployeePassword(password))) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  await setEmployeeSession();
  return NextResponse.json({ ok: true });
}
