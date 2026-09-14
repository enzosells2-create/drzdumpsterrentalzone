import { DumpsterSizeOption } from "./types";

/**
 * ── COMMERCIAL ACCOUNTS ──
 * A completely separate track from the residential booking flow: businesses
 * get $50/month off, commit to a minimum term (billed monthly, not paid
 * upfront through Stripe), and sign a different contract that includes
 * Net-30 credit terms. Reuses the same DUMPSTER_SIZES inventory pool as
 * residential — a commercial dumpster out on a 6-month contract blocks that
 * same physical unit from residential bookings too.
 */
export const COMMERCIAL_MONTHLY_DISCOUNT = 50;

export const COMMERCIAL_TERM_OPTIONS = [
  { months: 3, label: "3 Months (minimum)" },
  { months: 6, label: "6 Months" },
  { months: 12, label: "12 Months" },
] as const;

export type CommercialTermMonths = (typeof COMMERCIAL_TERM_OPTIONS)[number]["months"];

/** Monthly rate = the residential 1-month rate (weeklyPrice x 4), minus the flat commercial discount. */
export function calculateCommercialMonthlyRate(size: DumpsterSizeOption): number {
  return size.weeklyPrice * 4 - COMMERCIAL_MONTHLY_DISCOUNT;
}

export function getCommercialTermLabel(months: number): string {
  return COMMERCIAL_TERM_OPTIONS.find((o) => o.months === months)?.label ?? `${months} months`;
}

export const COMMERCIAL_CREDIT_TERMS =
  "Net 30 — invoiced monthly, payment due within 30 days of each invoice date.";
