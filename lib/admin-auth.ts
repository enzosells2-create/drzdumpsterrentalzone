import { cookies } from "next/headers";
import crypto from "crypto";

/**
 * Basic shared-password gate for /admin. Good enough for a single owner
 * checking their own bookings; if you ever add employees with their own
 * logins, swap this for real per-user auth (e.g. NextAuth).
 */
const COOKIE_NAME = "drz_admin_session";

function sessionToken(): string {
  const secret = process.env.ADMIN_PASSWORD || "";
  return crypto.createHash("sha256").update(`${secret}:drz-admin-session`).digest("hex");
}

export async function isAdminAuthed(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === sessionToken();
}

export async function checkAdminPassword(password: string): Promise<boolean> {
  return Boolean(process.env.ADMIN_PASSWORD) && password === process.env.ADMIN_PASSWORD;
}

export async function setAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
