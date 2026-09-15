"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { calculateCommercialPrice } from "@/lib/commercial";
import { DUMPSTER_SIZES, RENTAL_DURATION_OPTIONS } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";

type FormState = {
  accountNumber: string;
  sizeId: string;
  deliveryDate: string;
  rentalDays: number | "";
  street: string;
  city: string;
  state: string;
  zip: string;
};

const initialForm: FormState = {
  accountNumber: "",
  sizeId: "",
  deliveryDate: "",
  rentalDays: "",
  street: "",
  city: "",
  state: "MI",
  zip: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function CommercialOrderForm() {
  const searchParams = useSearchParams();
  const prefilledAccount = searchParams.get("account") ?? "";
  const [form, setForm] = useState<FormState>({ ...initialForm, accountNumber: prefilledAccount });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<{ confirmationNumber: string; price: number } | null>(null);

  const today = new Date().toISOString().split("T")[0];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const selectedSize = DUMPSTER_SIZES.find((s) => s.id === form.sizeId) ?? null;
  const previewPrice =
    selectedSize && form.rentalDays ? calculateCommercialPrice(selectedSize, Number(form.rentalDays)) : null;

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.accountNumber.trim()) next.accountNumber = "Account number is required.";
    if (!form.sizeId) next.sizeId = "Select a dumpster size.";
    if (!form.deliveryDate) next.deliveryDate = "Delivery date is required.";
    if (!form.rentalDays) next.rentalDays = "Rental duration is required.";
    if (!form.street.trim()) next.street = "Street address is required.";
    if (!form.city.trim()) next.city = "City is required.";
    if (!/^\d{5}$/.test(form.zip.trim())) next.zip = "Enter a valid 5-digit ZIP code.";
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/commercial/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: form.accountNumber.trim(),
          sizeId: form.sizeId,
          deliveryDate: form.deliveryDate,
          rentalDays: Number(form.rentalDays),
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zip: form.zip.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setResult(data);
    } catch {
      setSubmitError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: keyof FieldErrors) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm text-navy outline-none transition focus:ring-2 focus:ring-navy-light ${
      errors[field] ? "border-red" : "border-gray-200"
    }`;

  if (result) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-6">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
        <div>
          <p className="font-semibold text-green-800">Order placed!</p>
          <div className="mt-2 space-y-1 text-sm text-green-700">
            <p>Confirmation #: <span className="font-mono font-semibold">{result.confirmationNumber}</span></p>
            <p>Price: <span className="font-semibold">{formatCurrency(result.price)}</span></p>
          </div>
          <p className="mt-3 text-sm text-green-700">
            We'll be in touch to confirm delivery. This order will be included on your next monthly
            invoice — no card charge today.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setResult(null);
                setForm((f) => ({ ...initialForm, accountNumber: f.accountNumber }));
              }}
              className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light"
            >
              Place Another Order
            </button>
            <Link
              href="/commercial/account"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-navy ring-1 ring-gray-200 transition hover:bg-gray-50"
            >
              View My Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <Field label="Commercial Account Number" error={errors.accountNumber}>
        <input
          className={inputClass("accountNumber")}
          value={form.accountNumber}
          onChange={(e) => set("accountNumber", e.target.value.toUpperCase())}
          placeholder="DRZ-BIZ-123456789"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Dumpster Size" error={errors.sizeId}>
          <select className={inputClass("sizeId")} value={form.sizeId} onChange={(e) => set("sizeId", e.target.value)}>
            <option value="" disabled>
              Select size
            </option>
            {DUMPSTER_SIZES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Rental Duration" error={errors.rentalDays}>
          <select
            className={inputClass("rentalDays")}
            value={form.rentalDays}
            onChange={(e) => set("rentalDays", Number(e.target.value))}
          >
            <option value="" disabled>
              Select duration
            </option>
            {RENTAL_DURATION_OPTIONS.map((o) => (
              <option key={o.days} value={o.days}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Delivery Date" error={errors.deliveryDate} className="sm:col-span-2">
          <input
            type="date"
            min={today}
            className={inputClass("deliveryDate")}
            value={form.deliveryDate}
            onChange={(e) => set("deliveryDate", e.target.value)}
          />
        </Field>
      </div>

      {previewPrice !== null && (
        <div className="rounded-lg border-l-4 border-red bg-blue-50/60 p-4">
          <p className="font-heading text-xl font-extrabold text-red">{formatCurrency(previewPrice)}</p>
          <p className="mt-1 text-xs text-gray-500">Your commercial rate ($50 off standard) for this order.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Delivery Street Address" error={errors.street} className="sm:col-span-2">
          <input
            className={inputClass("street")}
            value={form.street}
            onChange={(e) => set("street", e.target.value)}
            placeholder="123 Main St"
          />
        </Field>
        <Field label="City" error={errors.city}>
          <input
            className={inputClass("city")}
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="South Lyon"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="State">
            <select className={inputClass("state")} value={form.state} onChange={(e) => set("state", e.target.value)}>
              <option value="MI">Michigan</option>
              <option value="OH">Ohio</option>
              <option value="IN">Indiana</option>
              <option value="IL">Illinois</option>
            </select>
          </Field>
          <Field label="ZIP" error={errors.zip}>
            <input
              className={inputClass("zip")}
              value={form.zip}
              onChange={(e) => set("zip", e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="48178"
            />
          </Field>
        </div>
      </div>

      {submitError && (
        <p className="rounded-lg bg-red/10 px-3.5 py-2.5 text-sm font-medium text-red">{submitError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-red px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Placing order…" : "Place Order"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Don't have a commercial account yet?{" "}
        <Link href="/commercial" className="font-semibold text-navy underline underline-offset-4 hover:text-red">
          Sign up here
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-navy">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red">{error}</p>}
    </div>
  );
}
