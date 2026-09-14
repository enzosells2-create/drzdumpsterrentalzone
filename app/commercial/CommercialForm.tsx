"use client";

import { useState } from "react";
import { CheckCircle2, FileText } from "lucide-react";
import {
  COMMERCIAL_CREDIT_TERMS,
  COMMERCIAL_MONTHLY_DISCOUNT,
  COMMERCIAL_TERM_OPTIONS,
  calculateCommercialMonthlyRate,
} from "@/lib/commercial";
import { COMPANY, DUMPSTER_SIZES, OVERAGE_FEES, PROHIBITED_ITEMS } from "@/lib/pricing";
import { formatCurrency, formatPhone, isValidEmail } from "@/lib/format";

type FormState = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  sizeId: string;
  termMonths: number | "";
  startDate: string;
  signature: string;
  agreedTerms: boolean;
};

const initialForm: FormState = {
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "MI",
  zip: "",
  sizeId: "",
  termMonths: "",
  startDate: "",
  signature: "",
  agreedTerms: false,
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function CommercialForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<{ confirmationNumber: string; monthlyRate: number; termMonths: number } | null>(
    null
  );

  const today = new Date().toISOString().split("T")[0];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const selectedSize = DUMPSTER_SIZES.find((s) => s.id === form.sizeId) ?? null;
  const monthlyRate = selectedSize ? calculateCommercialMonthlyRate(selectedSize) : null;
  const standardRate = selectedSize ? selectedSize.weeklyPrice * 4 : null;

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.businessName.trim()) next.businessName = "Business name is required.";
    if (!form.contactName.trim()) next.contactName = "Contact name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(form.email)) next.email = "Enter a valid email address.";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a valid 10-digit phone number.";
    if (!form.street.trim()) next.street = "Street address is required.";
    if (!form.city.trim()) next.city = "City is required.";
    if (!/^\d{5}$/.test(form.zip.trim())) next.zip = "Enter a valid 5-digit ZIP code.";
    if (!form.sizeId) next.sizeId = "Select a dumpster size.";
    if (!form.termMonths) next.termMonths = "Select a contract term.";
    if (!form.startDate) next.startDate = "Start date is required.";
    if (form.signature.trim().length < 2) next.signature = "Signature is required.";
    if (!form.agreedTerms) next.agreedTerms = "You must agree to the commercial terms.";
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
      const res = await fetch("/api/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName.trim(),
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zip: form.zip.trim(),
          sizeId: form.sizeId,
          termMonths: Number(form.termMonths),
          startDate: form.startDate,
          signature: form.signature.trim(),
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
          <p className="font-semibold text-green-800">Commercial account created!</p>
          <div className="mt-2 space-y-1 text-sm text-green-700">
            <p>Confirmation #: <span className="font-mono font-semibold">{result.confirmationNumber}</span></p>
            <p>Monthly rate: <span className="font-semibold">{formatCurrency(result.monthlyRate)}</span></p>
            <p>Term: <span className="font-semibold">{result.termMonths} months</span></p>
          </div>
          <p className="mt-3 text-sm text-green-700">
            We'll be in touch to schedule delivery. You'll be invoiced monthly — no card charge today.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-navy">Business Info</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Business Name" error={errors.businessName} className="sm:col-span-2">
            <input
              className={inputClass("businessName")}
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              placeholder="Acme Construction LLC"
            />
          </Field>
          <Field label="Contact Name" error={errors.contactName}>
            <input
              className={inputClass("contactName")}
              value={form.contactName}
              onChange={(e) => set("contactName", e.target.value)}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              className={inputClass("email")}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="jane@acme.com"
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
            <Field label="State" error={errors.state}>
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
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-navy">Service Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Dumpster Size" error={errors.sizeId}>
            <select className={inputClass("sizeId")} value={form.sizeId} onChange={(e) => set("sizeId", e.target.value)}>
              <option value="" disabled>
                Select size
              </option>
              {DUMPSTER_SIZES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} — {formatCurrency(calculateCommercialMonthlyRate(s))}/mo
                </option>
              ))}
            </select>
          </Field>
          <Field label="Contract Term" error={errors.termMonths}>
            <select
              className={inputClass("termMonths")}
              value={form.termMonths}
              onChange={(e) => set("termMonths", Number(e.target.value))}
            >
              <option value="" disabled>
                Select term
              </option>
              {COMMERCIAL_TERM_OPTIONS.map((o) => (
                <option key={o.months} value={o.months}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start Date" error={errors.startDate} className="sm:col-span-2">
            <input
              type="date"
              min={today}
              className={inputClass("startDate")}
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </Field>
        </div>

        {selectedSize && monthlyRate !== null && (
          <div className="rounded-lg border-l-4 border-red bg-blue-50/60 p-4">
            <p className="text-sm text-gray-600">
              Standard monthly rate: <span className="line-through">{formatCurrency(standardRate!)}</span>
            </p>
            <p className="font-heading text-xl font-extrabold text-red">
              {formatCurrency(monthlyRate)}
              <span className="text-sm font-medium text-gray-500"> /month</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              ${COMMERCIAL_MONTHLY_DISCOUNT} off our standard rate, billed monthly for the full term.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center gap-2 border-b-2 border-red pb-4">
          <FileText className="h-5 w-5 text-red" />
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-navy">
            Commercial Rental Agreement
          </h2>
        </div>

        <div className="space-y-3 rounded-md bg-gray-50 p-3.5 text-sm leading-relaxed text-gray-600">
          <p>
            <strong className="text-navy">Minimum Term.</strong> This agreement requires a minimum
            commitment of 3 months. Early termination before the end of the selected term may result in
            a final invoice for the remaining committed months.
          </p>
          <p>
            <strong className="text-navy">Billing &amp; Credit Terms.</strong> Customer will be invoiced
            monthly for the Monthly Rate shown above. {COMMERCIAL_CREDIT_TERMS} No payment is collected
            at signup.
          </p>
          <p>
            <strong className="text-navy">Included.</strong> {"2"} tons of weight included per pickup
            cycle. Delivery to and pickup from the address provided above.
          </p>
          <p>
            <strong className="text-navy">Prohibited Items.</strong> {PROHIBITED_ITEMS.join(", ")}.
          </p>
          <p>
            <strong className="text-navy">Overage Fees.</strong> Additional ton:{" "}
            {formatCurrency(OVERAGE_FEES.extraTon)}/ton. Overloaded dumpster:{" "}
            {formatCurrency(OVERAGE_FEES.overloaded)}. Tires: {formatCurrency(OVERAGE_FEES.tireEach)}{" "}
            each. Refrigerators/appliances with refrigerant: {formatCurrency(OVERAGE_FEES.fridgeEach)}{" "}
            each.
          </p>
          <p>
            <strong className="text-navy">Liability.</strong> Customer is responsible for the dumpster(s)
            while on their property, including protecting against damage, vandalism, or unauthorized use.{" "}
            {COMPANY.name} is not responsible for damage to driveways, lawns, or landscaping caused by
            normal delivery and pickup operations.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Authorized Signature</label>
          <input
            className="signature-line"
            value={form.signature}
            onChange={(e) => set("signature", e.target.value)}
            placeholder="Type your full name to sign"
          />
          {errors.signature && <p className="mt-1 text-xs font-medium text-red">{errors.signature}</p>}
        </div>

        <label className="flex items-start gap-2.5 text-sm text-gray-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-red"
            checked={form.agreedTerms}
            onChange={(e) => set("agreedTerms", e.target.checked)}
          />
          I am authorized to sign on behalf of the business above, and I agree to the minimum term,
          billing, and credit terms of this commercial rental agreement.
        </label>
        {errors.agreedTerms && <p className="-mt-2 text-xs font-medium text-red">{errors.agreedTerms}</p>}
      </div>

      {submitError && (
        <p className="rounded-lg bg-red/10 px-3.5 py-2.5 text-sm font-medium text-red">{submitError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Sign & Create Commercial Account"}
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
