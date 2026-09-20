import { cookies } from "next/headers";
import crypto from "crypto";

/**
 * Basic shared-password gate for /employee — separate from the admin
 * password, so employees can see the delivery schedule without getting
 * access to payments, balances, promo codes, or commercial accounts.
 */
const COOKIE_NAME = "drz_employee_session";

function sessionToken(): string {
  const secret = process.env.EMPLOYEE_PASSWORD || "";
  return crypto.createHash("sha256").update(`${secret}:drz-employee-session`).digest("hex");
}

export async function isEmployeeAuthed(): Promise<boolean> {
  if (!process.env.EMPLOYEE_PASSWORD) return false;
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === sessionToken();
}

export async function checkEmployeePassword(password: string): Promise<boolean> {
  return Boolean(process.env.EMPLOYEE_PASSWORD) && password === process.env.EMPLOYEE_PASSWORD;
}

export async function setEmployeeSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearEmployeeSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
