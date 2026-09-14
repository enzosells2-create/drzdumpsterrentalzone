"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, LogOut, Mail, MapPin, MessageSquare, Phone, Tag } from "lucide-react";
import { COMPANY, DUMPSTER_SIZES } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";

export type SerializedCommercialAccount = {
  id: string;
  confirmationNumber: string;
  sizeId: string;
  startDate: string;
  endDate: string;
  termMonths: number;
  monthlyRate: number;
  status: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  createdAt: string;
};

const STATUSES = ["Active", "Cancelled"] as const;

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-green-50 text-green-700 ring-green-200",
  Cancelled: "bg-gray-100 text-gray-500 ring-gray-200",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function sizeLabel(sizeId: string): string {
  return DUMPSTER_SIZES.find((s) => s.id === sizeId)?.label ?? sizeId;
}

export default function AdminCommercialTable({ initialAccounts }: { initialAccounts: SerializedCommercialAccount[] }) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.status === "Active");
  const monthlyRecurringTotal = activeAccounts.reduce((sum, a) => sum + a.monthlyRate, 0);

  async function handleStatusChange(id: string, status: string) {
    setUpdatingId(id);
    const previous = accounts;
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      const res = await fetch(`/api/admin/commercial/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      setAccounts(previous);
      alert("Couldn't update that account. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b-[3px] border-red bg-gradient-to-br from-navy to-navy-light text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-red to-red-dark">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold leading-tight">{COMPANY.name}</p>
              <p className="text-xs text-white/70">Commercial Accounts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" /> Bookings
            </Link>
            <Link
              href="/admin/messages"
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              <MessageSquare className="h-4 w-4" /> Messages
            </Link>
            <Link
              href="/admin/promo-codes"
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              <Tag className="h-4 w-4" /> Promo Codes
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" /> Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl font-bold text-navy">Commercial Accounts</h1>
        <p className="mt-1 text-sm text-gray-500">
          {accounts.length} total, {activeAccounts.length} active
        </p>
        {activeAccounts.length > 0 && (
          <p className="mt-1 text-sm font-semibold text-navy">
            {formatCurrency(monthlyRecurringTotal)}/month in active recurring billing — remember to invoice
            these manually (Net 30) each month.
          </p>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          {accounts.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No commercial accounts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-2.5 font-semibold">Confirmation</th>
                    <th className="px-5 py-2.5 font-semibold">Business</th>
                    <th className="px-5 py-2.5 font-semibold">Size</th>
                    <th className="px-5 py-2.5 font-semibold">Term</th>
                    <th className="px-5 py-2.5 font-semibold">Monthly Rate</th>
                    <th className="px-5 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id} className="border-t border-gray-100 align-top">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-navy">{a.confirmationNumber}</td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-navy">{a.businessName}</p>
                        <p className="text-xs text-gray-500">{a.contactName}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="h-3 w-3" /> {a.phone}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="h-3 w-3" /> {a.email}
                        </p>
                        <p className="mt-0.5 flex items-start gap-1 text-xs text-gray-500">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                          {a.street}, {a.city}, {a.state} {a.zip}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{sizeLabel(a.sizeId)}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {a.termMonths} months
                        <p className="text-xs text-gray-400">
                          {formatDate(a.startDate)} – {formatDate(a.endDate)}
                        </p>
                      </td>
                      <td className="px-5 py-3 font-semibold text-navy">{formatCurrency(a.monthlyRate)}</td>
                      <td className="px-5 py-3">
                        <select
                          value={a.status}
                          disabled={updatingId === a.id}
                          onChange={(e) => handleStatusChange(a.id, e.target.value)}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 outline-none disabled:opacity-50 ${STATUS_STYLES[a.status] ?? ""}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
