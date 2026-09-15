import { cookies } from "next/headers";
import crypto from "crypto";

/**
 * Login for commercial clients — the credential IS their account number
 * (the one they got when they signed up), no separate password. The
 * cookie stores the account's internal id plus an HMAC signature (keyed
 * off ADMIN_PASSWORD, reusing the one server secret this app already
 * has) so a client can't forge or swap in a different account's id.
 */
const COOKIE_NAME = "drz_commercial_session";
const SECRET = process.env.ADMIN_PASSWORD || "drz-commercial-fallback-secret";

function sign(accountId: string): string {
  return crypto.createHmac("sha256", SECRET).update(accountId).digest("hex");
}

export async function setCommercialSession(accountId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, `${accountId}.${sign(accountId)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearCommercialSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Returns the logged-in commercial account's id, or null if not logged in. */
export async function getCommercialAccountId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const dot = raw.indexOf(".");
  if (dot === -1) return null;
  const accountId = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!accountId || !sig || sig !== sign(accountId)) return null;
  return accountId;
}
