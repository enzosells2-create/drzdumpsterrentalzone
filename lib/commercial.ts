import { DumpsterSizeOption } from "./types";
import { calculatePrice } from "./pricing";

/**
 * ── COMMERCIAL ACCOUNTS ──
 * A completely separate track from residential: a business signs up once
 * (contract + Net 30 credit terms, no upfront payment), then places
 * individual dumpster orders under that account over time — each order
 * priced $50 less than the equivalent residential rate. The deal depends on
 * averaging at least 3 orders per month; the site doesn't enforce this
 * automatically. The owner reviews each account's order count in admin and,
 * for any month that falls short, manually charges the difference back up
 * to full price via that order's outstandingBalance (same mechanism as
 * residential overage fees).
 */
export const COMMERCIAL_DISCOUNT = 50;
export const COMMERCIAL_MIN_ORDERS_PER_MONTH = 3;

export const COMMERCIAL_CREDIT_TERMS =
  "Net 30 — invoiced monthly, payment due within 30 days of each invoice date.";

/** Same day/3-day/weekly pricing structure as residential, $50 off. */
export function calculateCommercialPrice(size: DumpsterSizeOption, rentalDays: number): number {
  return Math.max(0, calculatePrice(size, rentalDays) - COMMERCIAL_DISCOUNT);
}
