"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Tag, Trash2 } from "lucide-react";
import { COMPANY } from "@/lib/pricing";

export type SerializedPromoCode = {
  id: string;
  code: string;
  discountPercent: number;
  active: boolean;
  expiresAt: string | null;
  timesUsed: number;
  createdAt: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PromoCodesManager({ initialCodes }: { initialCodes: SerializedPromoCode[] }) {
  const router = useRouter();
  const [codes, setCodes] = useState(initialCodes);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [newCode, setNewCode] = useState("");
  const [newPercent, setNewPercent] = useState("15");
  const [newExpires, setNewExpires] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const activeCode = codes.find((c) => c.active);

  async function handleCreate() {
    setCreateError("");
    if (!newCode.trim()) {
      setCreateError("Enter a code.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.trim(),
          discountPercent: Number(newPercent) || 15,
          expiresAt: newExpires || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setCreateError(result.error || "Couldn't create that code.");
        return;
      }
      setCodes((prev) => [result.code, ...prev]);
      setNewCode("");
      setNewPercent("15");
      setNewExpires("");
    } catch {
      setCreateError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    setUpdatingId(id);
    const previous = codes;
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      setCodes(previous);
      alert("Couldn't update that code. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Delete promo code "${code}"? This can't be undone.`)) return;
    setUpdatingId(id);
    const previous = codes;
    setCodes((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      setCodes(previous);
      alert("Couldn't delete that code. Please try again.");
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
              <Tag className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold leading-tight">{COMPANY.name}</p>
              <p className="text-xs text-white/70">Promo Codes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" /> Bookings
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

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl font-bold text-navy">Promo Codes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new code for each social media post, then deactivate the old one. Only codes
          marked Active can be redeemed at checkout.
        </p>

        {activeCode && (
          <p className="mt-3 rounded-lg bg-green-50 px-3.5 py-2.5 text-sm font-medium text-green-700 ring-1 ring-green-200">
            Currently active: <strong>{activeCode.code}</strong> ({activeCode.discountPercent}% off)
            {codes.filter((c) => c.active).length > 1 ? " — and others, see below" : ""}
          </p>
        )}

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-navy">New Code</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1.3fr_0.8fr_1fr_auto]">
            <input
              className="rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm uppercase text-navy outline-none focus:ring-2 focus:ring-navy-light"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="e.g. DRZFALL15"
              maxLength={20}
            />
            <input
              type="number"
              min={1}
              max={100}
              className="rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-navy outline-none focus:ring-2 focus:ring-navy-light"
              value={newPercent}
              onChange={(e) => setNewPercent(e.target.value)}
              placeholder="15"
            />
            <input
              type="date"
              className="rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-navy outline-none focus:ring-2 focus:ring-navy-light"
              value={newExpires}
              onChange={(e) => setNewExpires(e.target.value)}
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-lg bg-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">Discount % and expiration date are optional — defaults to 15% off with no expiration.</p>
          {createError && <p className="mt-2 text-sm font-medium text-red">{createError}</p>}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          {codes.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">No promo codes yet — create one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-2.5 font-semibold">Code</th>
                    <th className="px-5 py-2.5 font-semibold">Discount</th>
                    <th className="px-5 py-2.5 font-semibold">Times Used</th>
                    <th className="px-5 py-2.5 font-semibold">Expires</th>
                    <th className="px-5 py-2.5 font-semibold">Created</th>
                    <th className="px-5 py-2.5 font-semibold">Status</th>
                    <th className="px-5 py-2.5 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.id} className="border-t border-gray-100">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-navy">{c.code}</td>
                      <td className="px-5 py-3 text-gray-600">{c.discountPercent}%</td>
                      <td className="px-5 py-3 text-gray-600">{c.timesUsed}</td>
                      <td className="px-5 py-3 text-gray-600">{c.expiresAt ? formatDate(c.expiresAt) : "—"}</td>
                      <td className="px-5 py-3 text-gray-600">{formatDate(c.createdAt)}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleToggleActive(c.id, !c.active)}
                          disabled={updatingId === c.id}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 outline-none disabled:opacity-50 ${
                            c.active
                              ? "bg-green-50 text-green-700 ring-green-200"
                              : "bg-gray-100 text-gray-500 ring-gray-200"
                          }`}
                        >
                          {c.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          disabled={updatingId === c.id}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red/10 hover:text-red disabled:opacity-50"
                          aria-label={`Delete ${c.code}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
