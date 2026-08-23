"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Lock, Tag, X } from "lucide-react";
import { BookingData } from "@/lib/types";
import { TAX_RATE } from "@/lib/pricing";
import {
  detectCardBrand,
  formatCardNumber,
  formatCurrency,
  formatExpiry,
  isExpiryValid,
} from "@/lib/format";

// ────────────────────────────────────────────────────────────────────
// STRIPE INTEGRATION SPOT
// Paste your Stripe *publishable* key below (never put a secret key in
// client-side code). Then swap the plain <input> fields in this file
// for Stripe Elements (https://docs.stripe.com/stripe-js/react) and
// create a PaymentIntent on your server to actually process the charge.
// For now, this step only validates the card fields locally and stores
// the last 4 digits + brand — no real charge is made and no full card
// number ever leaves the browser.
// ────────────────────────────────────────────────────────────────────
const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_PASTE_YOUR_STRIPE_KEY_HERE";

type Props = {
  data: BookingData;
  onBack: () => void;
  onContinue: (patch: Partial<BookingData>) => void;
};

type FieldErrors = { cardName?: string; cardNumber?: string; cardExpiry?: string; cardCvc?: string };

const STRIPE_KEY_IS_PLACEHOLDER = STRIPE_PUBLISHABLE_KEY.includes("PASTE_YOUR_STRIPE_KEY");

export default function StepPayment({ data, onBack, onContinue }: Props) {
  const [cardName, setCardName] = useState(data.cardName);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const [promoInput, setPromoInput] = useState(data.promoCode ?? "");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(
    data.promoCode && data.discountPercent ? { code: data.promoCode, discountPercent: data.discountPercent } : null
  );
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState("");

  const basePrice = data.price ?? 0;
  const discount = appliedPromo
    ? Math.round(basePrice * (appliedPromo.discountPercent / 100) * 100) / 100
    : 0;
  const discountedSubtotal = Math.round((basePrice - discount) * 100) / 100;
  const tax = Math.round(discountedSubtotal * TAX_RATE * 100) / 100;
  const total = Math.round((discountedSubtotal + tax) * 100) / 100;

  async function handleApplyPromo() {
    setPromoError("");
    if (!promoInput.trim()) {
      setPromoError("Enter a promo code.");
      return;
    }
    setPromoChecking(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim() }),
      });
      const result = await res.json();
      if (!res.ok || !result.valid) {
        setPromoError(result.error || "That promo code isn't valid.");
        setAppliedPromo(null);
        return;
      }
      setAppliedPromo({ code: result.code, discountPercent: result.discountPercent });
      setPromoInput(result.code);
    } catch {
      setPromoError("Couldn't check that code — check your connection and try again.");
    } finally {
      setPromoChecking(false);
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  }

  const digits = cardNumber.replace(/\D/g, "");
  const brand = detectCardBrand(cardNumber);
  const maskedCardDisplay =
    digits.length > 0
      ? ("•".repeat(Math.max(digits.length - 4, 0)) + digits.slice(-4)).replace(/(.{4})/g, "$1 ").trim()
      : "•••• •••• •••• ••••";

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!cardName.trim()) next.cardName = "Cardholder name is required.";
    if (digits.length < 15 || digits.length > 16) next.cardNumber = "Enter a valid card number.";
    if (!isExpiryValid(cardExpiry)) next.cardExpiry = "Enter a valid, non-expired MM/YY date.";
    if (cardCvc.length < 3 || cardCvc.length > 4) next.cardCvc = "Enter a valid CVC.";
    return next;
  }

  function handleContinue() {
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    onContinue({
      cardName: cardName.trim(),
      cardLast4: digits.slice(-4),
      cardBrand: brand,
      promoCode: appliedPromo?.code ?? null,
      discountPercent: appliedPromo?.discountPercent ?? null,
      discountAmount: appliedPromo ? discount : null,
    });
  }

  const inputClass = (field: keyof FieldErrors) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm text-navy outline-none transition focus:ring-2 focus:ring-navy-light ${
      errors[field] ? "border-red" : "border-gray-200"
    }`;

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="font-heading text-2xl font-bold text-navy sm:text-3xl">Payment</h2>

      {STRIPE_KEY_IS_PLACEHOLDER && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
          Dev note: no Stripe publishable key is configured yet. Add
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local, or paste it directly
          near the top of components/steps/StepPayment.tsx.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-navy">
              Order Summary
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <Row label={`${data.size?.label ?? "Dumpster"} rental`} value={formatCurrency(basePrice)} />
              {appliedPromo && (
                <Row
                  label={`Promo ${appliedPromo.code} (-${appliedPromo.discountPercent}%)`}
                  value={`-${formatCurrency(discount)}`}
                  discount
                />
              )}
              <Row label={`Tax (${(TAX_RATE * 100).toFixed(0)}%)`} value={formatCurrency(tax)} />
              <div className="border-t border-gray-100 pt-2">
                <Row label="Total" value={formatCurrency(total)} bold />
              </div>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              {appliedPromo ? (
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3.5 py-2.5 text-sm ring-1 ring-green-200">
                  <span className="flex items-center gap-1.5 font-semibold text-green-700">
                    <Tag className="h-4 w-4" /> {appliedPromo.code} applied
                  </span>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="flex items-center gap-1 text-xs font-medium text-green-700 underline-offset-2 hover:underline"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">Promo Code</label>
                  <div className="flex gap-2">
                    <input
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm uppercase text-navy outline-none transition focus:ring-2 focus:ring-navy-light ${
                        promoError ? "border-red" : "border-gray-200"
                      }`}
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      placeholder="Enter code"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoChecking}
                      className="shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {promoChecking ? "Checking…" : "Apply"}
                    </button>
                  </div>
                  {promoError && <p className="mt-1 text-xs font-medium text-red">{promoError}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Live card preview */}
          <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-navy-light p-6 font-mono text-white shadow-lg">
            <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-white/5" />
            <div className="flex items-center justify-between">
              <div className="h-9 w-12 rounded bg-gradient-to-br from-yellow-300 to-yellow-500" />
              <span className="font-heading text-sm font-bold uppercase tracking-widest text-white/80">
                {brand}
              </span>
            </div>
            <p className="mt-8 text-xl tracking-widest sm:text-2xl">{maskedCardDisplay}</p>
            <div className="mt-6 flex items-end justify-between text-sm">
              <div>
                <p className="text-[10px] uppercase text-white/60">Card Holder</p>
                <p className="font-medium uppercase tracking-wide">{cardName || "YOUR NAME"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-white/60">Expires</p>
                <p className="font-medium">{cardExpiry || "MM/YY"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-white/60">CVC</p>
                <p className="font-medium">{cardCvc ? "•".repeat(cardCvc.length) : "•••"}</p>
              </div>
            </div>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            <Lock className="h-3.5 w-3.5" /> Payments are encrypted. Your full card number is never stored.
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-navy">
            Card Details
          </h3>
          <div className="space-y-4">
            <Field label="Cardholder Name" error={errors.cardName}>
              <input
                className={inputClass("cardName")}
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Jane Doe"
              />
            </Field>

            <Field label="Card Number" error={errors.cardNumber}>
              <input
                className={inputClass("cardNumber")}
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Expiry (MM/YY)" error={errors.cardExpiry}>
                <input
                  className={inputClass("cardExpiry")}
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  inputMode="numeric"
                />
              </Field>
              <Field label="CVC" error={errors.cardCvc}>
                <input
                  className={inputClass("cardCvc")}
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  inputMode="numeric"
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={handleContinue}
          className="flex items-center gap-1.5 rounded-lg bg-red px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-dark"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
  discount = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  discount?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        bold ? "font-heading text-base font-bold text-navy" : discount ? "text-green-600" : "text-gray-600"
      }`}
    >
      <span>{label}</span>
      <span className={discount ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-navy">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red">{error}</p>}
    </div>
  );
}
