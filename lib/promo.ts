import { db } from "./db";

export type PromoValidation =
  | { valid: true; code: string; discountPercent: number }
  | { valid: false; error: string };

/**
 * Looks up a promo code and checks whether it can currently be redeemed.
 * Codes are matched case-insensitively (stored/compared upper-cased) since
 * customers will be typing these in from a social media post.
 */
export async function validatePromoCode(rawCode: string): Promise<PromoValidation> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, error: "Enter a promo code." };

  const promo = await db.promoCode.findUnique({ where: { code } });
  if (!promo) return { valid: false, error: "That promo code isn't valid." };
  if (!promo.active) return { valid: false, error: "That promo code is no longer active." };
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
    return { valid: false, error: "That promo code has expired." };
  }

  return { valid: true, code: promo.code, discountPercent: promo.discountPercent };
}

/** Rounds to cents the same way the rest of the pricing math does. */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}
