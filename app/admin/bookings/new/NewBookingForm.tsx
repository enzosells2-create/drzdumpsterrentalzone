"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { calculatePrice, DUMPSTER_SIZES, RENTAL_DURATION_OPTIONS } from "@/lib/pricing";
import { formatPhone, isValidEmail } from "@/lib/format";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  sizeId: string;
  deliveryDate: string;
  rentalDays: number | "";
  price: string;
  status: string;
};

const initialForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "MI",
  zip: "",
  sizeId: "",
  deliveryDate: "",
  rentalDays: "",
  price: "",
  status: "Confirmed",
};

const STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];

type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function NewBookingForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [priceTouched, setPriceTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const selectedSize = DUMPSTER_SIZES.find((s) => s.id === form.sizeId) ?? null;

  // Suggest the standard price once size + duration are picked, but only
  // until the admin actually edits the price field themselves — migrated
  // customers often have a different agreed rate.
  function handleSizeOrDurationChange(sizeId: string, rentalDays: number | "") {
    const size = DUMPSTER_SIZES.find((s) => s.id === sizeId);
    if (size && rentalDays && !priceTouched) {
      set("price", String(calculatePrice(size, Number(rentalDays))));
    }
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(form.email)) next.email = "Enter a valid email address.";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a valid 10-digit phone number.";
    if (!form.street.trim()) next.street = "Street address is required.";
    if (!form.city.trim()) next.city = "City is required.";
    if (!/^\d{5}$/.test(form.zip.trim())) next.zip = "Enter a valid 5-digit ZIP code.";
    if (!form.sizeId) next.sizeId = "Select a dumpster size.";
    if (!form.deliveryDate) next.deliveryDate = "Delivery date is required.";
    if (!form.rentalDays) next.rentalDays = "Rental duration is required.";
    if (form.price === "" || Number(form.price) < 0 || Number.isNaN(Number(form.price)))
      next.price = "Enter a valid price.";
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
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zip: form.zip.trim(),
          sizeId: form.sizeId,
          deliveryDate: form.deliveryDate,
          rentalDays: Number(form.rentalDays),
          price: Number(form.price),
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setResult(data.confirmationNumber);
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
          <p className="font-semibold text-green-800">Booking created!</p>
          <p className="mt-1 text-sm text-green-700">
            Confirmation #: <span className="font-mono font-semibold">{result}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setResult(null);
                setForm(initialForm);
                setPriceTouched(false);
              }}
              className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light"
            >
              Add Another
            </button>
            <Link
              href="/admin"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-navy ring-1 ring-gray-200 transition hover:bg-gray-50"
            >
              Back to Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-navy">Customer Info</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name" error={errors.fullName} className="sm:col-span-2">
            <input
              className={inputClass("fullName")}
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              className={inputClass("email")}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="jane@example.com"
            />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input
              className={inputClass("phone")}
              value={form.phone}
              onChange={(e) => set("phone", formatPhone(e.target.value))}
              placeholder="(555) 123-4567"
            />
          </Field>
          <Field label="Street Address" error={errors.street} className="sm:col-span-2">
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
      </div>

      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-navy">Order Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Dumpster Size" error={errors.sizeId}>
            <select
              className={inputClass("sizeId")}
              value={form.sizeId}
              onChange={(e) => {
                set("sizeId", e.target.value);
                handleSizeOrDurationChange(e.target.value, form.rentalDays);
              }}
            >
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
              onChange={(e) => {
                const days = Number(e.target.value);
                set("rentalDays", days);
                handleSizeOrDurationChange(form.sizeId, days);
              }}
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
          <Field label="Delivery Date" error={errors.deliveryDate}>
            <input
              type="date"
              className={inputClass("deliveryDate")}
              value={form.deliveryDate}
              onChange={(e) => set("deliveryDate", e.target.value)}
            />
          </Field>
          <Field label="Status">
            <select className={inputClass("status")} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price" error={errors.price} className="sm:col-span-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className={`${inputClass("price")} pl-6`}
                value={form.price}
                onChange={(e) => {
                  setPriceTouched(true);
                  set("price", e.target.value);
                }}
                placeholder={selectedSize && form.rentalDays ? String(calculatePrice(selectedSize, Number(form.rentalDays))) : "0.00"}
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">Pre-filled from the standard rate — edit if this customer has a different price.</p>
          </Field>
        </div>
      </div>

      {submitError && (
        <p className="rounded-lg bg-red/10 px-3.5 py-2.5 text-sm font-medium text-red">{submitError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create Booking"}
      </button>
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
