"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Trash2, Truck } from "lucide-react";
import { COMPANY } from "@/lib/pricing";

type Mode = "owner" | "employee";

const MODE_CONFIG: Record<
  Mode,
  { icon: typeof Trash2; heading: string; subtitle: string; loginPath: string; redirectPath: string }
> = {
  owner: {
    icon: Trash2,
    heading: `${COMPANY.name} Admin`,
    subtitle: "Sign in to view bookings",
    loginPath: "/api/admin/login",
    redirectPath: "/admin",
  },
  employee: {
    icon: Truck,
    heading: `${COMPANY.name} Deliveries`,
    subtitle: "Sign in to see today's schedule",
    loginPath: "/api/employee/login",
    redirectPath: "/employee",
  },
};

export default function OwnerEmployeeLogin({ defaultMode = "owner" }: { defaultMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  function switchMode(next: Mode) {
    setMode(next);
    setPassword("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(config.loginPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      router.push(config.redirectPath);
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
        <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => switchMode("owner")}
            className={`rounded-md py-2 text-sm font-semibold transition ${
              mode === "owner" ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-navy"
            }`}
          >
            Owner
          </button>
          <button
            type="button"
            onClick={() => switchMode("employee")}
            className={`rounded-md py-2 text-sm font-semibold transition ${
              mode === "employee" ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-navy"
            }`}
          >
            Employee
          </button>
        </div>

        <div className="mx-auto mt-6 flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-red to-red-dark text-white">
          <Icon className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-center font-heading text-xl font-bold text-navy">{config.heading}</h1>
        <p className="mt-1 text-center text-sm text-gray-500">{config.subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                key={mode}
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
            className="w-full rounded-lg bg-red py-2.5 text-sm font-semibold text-white transition hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
