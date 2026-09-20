"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Truck } from "lucide-react";
import { COMPANY } from "@/lib/pricing";

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/employee/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      router.push("/employee");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-navy to-navy-light text-white">
          <Truck className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-center font-heading text-xl font-bold text-navy">
          {COMPANY.name} Deliveries
        </h1>
        <p className="mt-1 text-center text-sm text-gray-500">Sign in to see today's schedule</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3.5 text-sm text-navy outline-none transition focus:ring-2 focus:ring-navy-light"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="mt-1.5 text-xs font-medium text-red">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting || !password}
            className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
