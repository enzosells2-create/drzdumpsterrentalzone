"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function CommercialLoginForm() {
  const router = useRouter();
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!accountNumber.trim()) {
      setError("Enter your commercial account number.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/commercial/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber: accountNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      router.push("/commercial/account");
      router.refresh();
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">Commercial Account Number</label>
        <input
          className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-navy outline-none transition focus:ring-2 focus:ring-navy-light ${
            error ? "border-red" : "border-gray-200"
          }`}
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.toUpperCase())}
          placeholder="DRZ-BIZ-123456789"
          autoFocus
        />
        {error && <p className="mt-1 text-xs font-medium text-red">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" /> {submitting ? "Logging in…" : "Log In"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have a commercial account yet?{" "}
        <Link href="/commercial" className="font-semibold text-navy underline underline-offset-4 hover:text-red">
          Sign up here
        </Link>
      </p>
    </form>
  );
}
