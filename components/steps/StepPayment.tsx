"use client";

import { FormEvent, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { ArrowLeft, ArrowRight, Lock, ShieldCheck, Tag, X } from "lucide-react";
import { BookingData } from "@/lib/types";
import { TAX_RATE } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const STRIPE_KEY_IS_MISSING = !STRIPE_PUBLISHABLE_KEY;

// Loaded once at module scope, not per-render — loadStripe() caches/dedupes
// internally, but there's no reason to even call it more than once.
const stripePromise = STRIPE_KEY_IS_MISSING ? null : loadStripe(STRIPE_PUBLISHABLE_KEY);

type Props = {
  data: BookingData;
  onBack: () => void;
  onContinue: (patch: Partial<BookingData>) => void;
};

type AppliedPromo = { code: string; discountPercent: number };

export default function StepPayment({ data, onBack, onContinue }: Props) {
  const [promoInput, setPromoInput] = useState(data.promoCode ?? "");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(
    data.promoCode && data.discountPercent ? { code: data.promoCode, discountPercent: data.discountPercent } : null
  );
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState("");

  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [settingUpPayment, setSettingUpPayment] = useState(true);
  const [setupError, setSetupError] = useState("");
  const [setupAttempt, setSetupAttempt] = useState(0);

  const basePrice = data.price ?? 0;
  const discount = appliedPromo
    ? Math.round(basePrice * (appliedPromo.discountPercent / 100) * 100) / 100
    : 0;
  const discountedSubtotal = Math.round((basePrice - discount) * 100) / 100;
  const tax = Math.round(discountedSubtotal * TAX_RATE * 100) / 100;
  const total = Math.round((discountedSubtotal + tax) * 100) / 100;

  // Creates the PaymentIntent on mount, and re-prices it (or creates a fresh
  // one, if the existing one can no longer be updated) whenever the applied
  // promo code changes.
  useEffect(() => {
    // Already paid for this exact order (e.g. the customer clicked Back
    // from Location to double-check something, then Continue again) —
    // don't charge a second time. See the early return in the render below.
    if (data.stripePaymentIntentId) {
      setSettingUpPayment(false);
      return;
    }
    if (!data.size || !data.rentalDays || STRIPE_KEY_IS_MISSING) {
      setSettingUpPayment(false);
      return;
    }
    let cancelled = false;

    async function setUpPayment() {
      setSettingUpPayment(true);
      setSetupError("");
      const payload = {
        sizeId: data.size!.id,
        rentalDays: data.rentalDays,
        promoCode: appliedPromo?.code ?? null,
      };
      try {
        let res = paymentIntentId
          ? await fetch("/api/stripe/payment-intent", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payload, paymentIntentId }),
            })
          : await fetch("/api/stripe/payment-intent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

        // The existing intent may no longer accept updates (e.g. already
        // confirming) — fall back to a brand new one.
        if (!res.ok && paymentIntentId) {
          res = await fetch("/api/stripe/payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Couldn't set up payment.");
        if (cancelled) return;
        setClientSecret(result.clientSecret);
        setPaymentIntentId(result.paymentIntentId);
      } catch (err) {
        if (!cancelled) setSetupError(err instanceof Error ? err.message : "Couldn't set up payment.");
      } finally {
        if (!cancelled) setSettingUpPayment(false);
      }
    }

    setUpPayment();
    return () => {
      cancelled = true;
    };
    // Deliberately excludes paymentIntentId — re-running this effect only on
    // promo changes (and the manual retry counter) avoids re-fetching in a
    // loop each time this same effect sets that state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedPromo?.code, setupAttempt]);

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

  function handlePaymentSuccess(details: { cardName: string; cardBrand: string; cardLast4: string; stripePaymentIntentId: string }) {
    onContinue({
      cardName: details.cardName,
      cardBrand: details.cardBrand,
      cardLast4: details.cardLast4,
      stripePaymentIntentId: details.stripePaymentIntentId,
      promoCode: appliedPromo?.code ?? null,
      discountPercent: appliedPromo?.discountPercent ?? null,
      discountAmount: appliedPromo ? discount : null,
    });
  }

  if (data.stripePaymentIntentId) {
    return (
      <div className="mx-auto max-w-2xl">
        <h2 className="font-heading text-2xl font-bold text-navy sm:text-3xl">Payment</h2>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">
              Payment already completed — {formatCurrency(total)} charged to your{" "}
              {data.cardBrand || "card"} ending {data.cardLast4 || "••••"}.
            </p>
            <p className="mt-1 text-sm text-green-700">
              You won't be charged again. Continue to pin your drop-off location.
            </p>
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
            onClick={() => onContinue({})}
            className="flex items-center gap-1.5 rounded-lg bg-red px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-dark"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const orderSummary = (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-navy">Order Summary</h3>
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
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="font-heading text-2xl font-bold text-navy sm:text-3xl">Payment</h2>

      {STRIPE_KEY_IS_MISSING && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
          Dev note: no Stripe publishable key is configured yet. Add
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (and STRIPE_SECRET_KEY) to .env.local.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {orderSummary}

          <div className="rounded-xl bg-gradient-to-br from-navy to-navy-light p-6 text-white shadow-lg">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-green-400" />
              <p className="font-heading text-sm font-bold uppercase tracking-wide">Secure Payment</p>
            </div>
            <p className="mt-2 text-sm text-white/70">
              Your card is processed directly by Stripe — the actual card number never touches our
              server.
            </p>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            <Lock className="h-3.5 w-3.5" /> Payments are encrypted end-to-end.
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-navy">
            Card Details
          </h3>

          {STRIPE_KEY_IS_MISSING ? (
            <p className="text-sm text-gray-400">Payment isn't configured yet.</p>
          ) : settingUpPayment ? (
            <p className="text-sm text-gray-400">Setting up secure payment…</p>
          ) : setupError ? (
            <div>
              <p className="text-sm font-medium text-red">{setupError}</p>
              <button
                type="button"
                onClick={() => setSetupAttempt((n) => n + 1)}
                className="mt-3 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-light"
              >
                Try again
              </button>
            </div>
          ) : clientSecret && stripePromise ? (
            <Elements stripe={stripePromise}>
              <CheckoutForm clientSecret={clientSecret} total={total} onSuccess={handlePaymentSuccess} />
            </Elements>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    </div>
  );
}

/** Renders inside <Elements> so it can use useStripe/useElements to actually
 * confirm the charge. Owns its own submit button rather than the page-level
 * Back/Continue row, since submitting needs the Stripe hooks. Uses the plain
 * CardElement (a single number/expiry/CVC field) rather than the fancier
 * PaymentElement — this app is card-only, and PaymentElement's UI surfaces
 * Stripe Link's bank/Klarna upsell tabs that add nothing here. */
function CheckoutForm({
  clientSecret,
  total,
  onSuccess,
}: {
  clientSecret: string;
  total: number;
  onSuccess: (details: { cardName: string; cardBrand: string; cardLast4: string; stripePaymentIntentId: string }) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardName, setCardName] = useState("");
  const [nameError, setNameError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPaymentError("");

    if (!cardName.trim()) {
      setNameError("Cardholder name is required.");
      return;
    }
    setNameError("");
    if (!stripe || !elements) return;
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setSubmitting(true);
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { name: cardName.trim() },
      },
    });

    if (error) {
      setPaymentError(
        error.message || "Your card could not be charged. Please check your details and try again."
      );
      setSubmitting(false);
      return;
    }

    if (!paymentIntent || paymentIntent.status !== "succeeded") {
      setPaymentError("Payment could not be completed. Please try again.");
      setSubmitting(false);
      return;
    }

    let cardBrand = "Card";
    let cardLast4 = "";
    try {
      const res = await fetch("/api/stripe/payment-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      });
      const details = await res.json();
      if (res.ok) {
        cardBrand = details.brand;
        cardLast4 = details.last4;
      }
    } catch {
      // Non-fatal — the payment already succeeded, we just won't have a
      // pretty brand/last4 to show. Booking creation re-derives these from
      // Stripe itself anyway.
    }

    onSuccess({ cardName: cardName.trim(), cardBrand, cardLast4, stripePaymentIntentId: paymentIntent.id });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Cardholder Name" error={nameError}>
        <input
          className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-navy outline-none transition focus:ring-2 focus:ring-navy-light ${
            nameError ? "border-red" : "border-gray-200"
          }`}
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          placeholder="Jane Doe"
        />
      </Field>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">Card Number</label>
        <div className="rounded-lg border border-gray-200 px-3.5 py-3 focus-within:ring-2 focus-within:ring-navy-light">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "14px",
                  color: "#1e293b",
                  fontFamily: "inherit",
                  "::placeholder": { color: "#9ca3af" },
                },
                invalid: { color: "#dc2626" },
              },
            }}
          />
        </div>
      </div>

      {paymentError && <p className="text-sm font-medium text-red">{paymentError}</p>}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Processing…" : `Pay ${formatCurrency(total)}`}
        {!submitting && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
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
