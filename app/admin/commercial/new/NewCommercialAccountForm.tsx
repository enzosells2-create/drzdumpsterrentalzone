"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { formatPhone, isValidEmail } from "@/lib/format";

type FormState = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
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
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function NewCommercialAccountForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [accountNumber, setAccountNumber] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

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
      const res = await fetch("/api/admin/commercial-accounts", {
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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setAccountNumber(data.accountNumber);
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

  if (accountNumber) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-6">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
        <div>
          <p className="font-semibold text-green-800">Commercial account created!</p>
          <p className="mt-2 text-sm text-green-700">
            Account number: <span className="font-mono font-semibold">{accountNumber}</span>
          </p>
          <p className="mt-1 text-sm text-green-700">
            We emailed this number to the address you entered so they can log in and place orders.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setAccountNumber(null);
                setForm(initialForm);
              }}
              className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light"
            >
              Add Another
            </button>
            <Link
              href="/admin/commercial"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-navy ring-1 ring-gray-200 transition hover:bg-gray-50"
            >
              Back to Commercial Accounts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
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
        className="w-full rounded-lg bg-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create Account"}
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
