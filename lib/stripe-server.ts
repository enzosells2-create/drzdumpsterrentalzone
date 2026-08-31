import Stripe from "stripe";

/**
 * Server-only Stripe client. Never import this from a "use client" file —
 * it reads the secret key, which must never reach the browser.
 */
const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey && process.env.NODE_ENV !== "production") {
  console.warn(
    "STRIPE_SECRET_KEY is not set — payment endpoints will fail until it's added to .env.local."
  );
}

export const stripe = new Stripe(secretKey || "sk_test_missing_key");
