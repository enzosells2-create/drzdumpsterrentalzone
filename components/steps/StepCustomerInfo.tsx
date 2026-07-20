"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BookingData } from "@/lib/types";
import { RENTAL_DURATION_OPTIONS } from "@/lib/pricing";
import { formatCurrency, formatPhone, isValidEmail } from "@/lib/format";

type Props = {
  data: BookingData;
  onBack: () => void;
  onContinue: (patch: Partial<BookingData>) => void;
};

type FieldErrors = Partial<Record<keyof BookingData, string>>;

export default function StepCustomerInfo({ data, onBack, onContinue }: Props) {
  const [form, setForm] = useState({
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    street: data.street,
    city: data.city,
    state: data.state || "MI",
    zip: data.zip,
    deliveryDate: data.deliveryDate,
    rentalDays: data.rentalDays ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const today = new Date().toISOString().split("T")[0];

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(form.email)) next.email = "Enter a valid email address.";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a valid 10-digit phone number.";
    if (!form.street.trim()) next.street = "Street address is required.";
    if (!form.city.trim()) next.city = "City is required.";
    if (!form.state.trim()) next.state = "State is required.";
    if (!/^\d{5}$/.test(form.zip.trim())) next.zip = "Enter a valid 5-digit ZIP code.";
    if (!form.deliveryDate) next.deliveryDate = "Delivery date is required.";
    if (!form.rentalDays) next.rentalDays = "Rental duration is required.";
    return next;
  }

  function handleContinue() {
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    onContinue({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zip: form.zip.trim(),
      deliveryDate: form.deliveryDate,
      rentalDays: Number(form.rentalDays) as BookingData["rentalDays"],
    });
  }

  const inputClass = (field: keyof FieldErrors) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm text-navy outline-none transition focus:ring-2 focus:ring-navy-light ${
      errors[field] ? "border-red" : "border-gray-200"
    }`;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-heading text-2xl font-bold text-navy sm:text-3xl">Your Information</h2>

      {data.size && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div>
            <p className="text-sm text-gray-500">Selected size</p>
            <p className="font-heading text-lg font-bold text-navy">{data.size.label} Dumpster</p>
          </div>
          <p className="font-heading text-xl font-extrabold text-red">
            {data.price !== null ? formatCurrency(data.price) : `$${data.size.priceMin}–$${data.size.priceMax}`}
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            placeholder="Livonia"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="State" error={errors.state}>
            <input
              className={inputClass("state")}
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              placeholder="MI"
            />
          </Field>
          <Field label="ZIP" error={errors.zip}>
            <input
              className={inputClass("zip")}
              value={form.zip}
              onChange={(e) => set("zip", e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="48150"
            />
          </Field>
        </div>

        <Field label="Preferred Delivery Date" error={errors.deliveryDate}>
          <input
            type="date"
            min={today}
            className={inputClass("deliveryDate")}
            value={form.deliveryDate}
            onChange={(e) => set("deliveryDate", e.target.value)}
          />
        </Field>

        <Field label="Rental Duration" error={errors.rentalDays}>
          <select
            className={inputClass("rentalDays")}
            value={form.rentalDays}
            onChange={(e) => set("rentalDays", e.target.value)}
          >
            <option value="" disabled>
              Select days
            </option>
            {RENTAL_DURATION_OPTIONS.map((days) => (
              <option key={days} value={days}>
                {days} days
              </option>
            ))}
          </select>
        </Field>
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
