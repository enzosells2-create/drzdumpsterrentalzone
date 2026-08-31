import { DumpsterSizeOption } from "./types";
import { calculatePrice, DUMPSTER_SIZES, TAX_RATE } from "./pricing";
import { roundToCents, validatePromoCode } from "./promo";

export type CheckoutTotals = {
  size: DumpsterSizeOption;
  basePrice: number;
  promoCode: string | null;
  discountAmount: number;
  subtotal: number;
  tax: number;
  total: number;
};

/**
 * Single source of truth for "what does this order actually cost" — used by
 * both the Stripe PaymentIntent route (to decide the real charge amount) and
 * anywhere else that needs to price a size + duration + optional promo code
 * the same way. Throws "UNKNOWN_SIZE" or "PROMO_INVALID" rather than
 * returning a result, so callers can map those to the right HTTP status.
 */
export async function computeCheckoutTotals(
  sizeId: string,
  rentalDays: number,
  promoCodeInput: string | null | undefined
): Promise<CheckoutTotals> {
  const size = DUMPSTER_SIZES.find((s) => s.id === sizeId);
  if (!size) throw new Error("UNKNOWN_SIZE");

  const basePrice = calculatePrice(size, rentalDays);

  let promoCode: string | null = null;
  let discountAmount = 0;
  if (promoCodeInput) {
    const result = await validatePromoCode(promoCodeInput);
    if (!result.valid) throw new Error("PROMO_INVALID");
    promoCode = result.code;
    discountAmount = roundToCents(basePrice * (result.discountPercent / 100));
  }

  const subtotal = roundToCents(basePrice - discountAmount);
  const tax = roundToCents(subtotal * TAX_RATE);
  const total = roundToCents(subtotal + tax);

  return { size, basePrice, promoCode, discountAmount, subtotal, tax, total };
}
