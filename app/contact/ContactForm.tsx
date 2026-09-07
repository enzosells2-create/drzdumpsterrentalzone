"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default function ContactForm() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    confirmationNumber: searchParams.get("confirmation") ?? "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Name, email, and message are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Something went wrong sending your message.");
        return;
      }
      setSent(true);
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-6">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
        <div>
          <p className="font-semibold text-green-800">Message sent!</p>
          <p className="mt-1 text-sm text-green-700">
            Thanks for reaching out — we'll get back to you as soon as we can.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Your Name">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="jane@example.com"
          />
        </Field>
        <Field label="Phone (optional)">
          <input
            className={inputClass}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="(555) 123-4567"
          />
        </Field>
        <Field label="Confirmation # (optional)">
          <input
            className={inputClass}
            value={form.confirmationNumber}
            onChange={(e) => set("confirmationNumber", e.target.value.toUpperCase())}
            placeholder="DRZ1234567890"
          />
        </Field>
      </div>

      <Field label="Message">
        <textarea
          className={`${inputClass} min-h-32 resize-y`}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="How can we help?"
        />
      </Field>

      {error && <p className="text-sm font-medium text-red">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-red px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-navy outline-none transition focus:ring-2 focus:ring-navy-light";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-navy">{label}</label>
      {children}
    </div>
  );
}
