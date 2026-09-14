"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  ChevronDown,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Tag,
} from "lucide-react";
import { COMMERCIAL_MIN_ORDERS_PER_MONTH } from "@/lib/commercial";
import { COMPANY, DUMPSTER_SIZES } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";

export type SerializedCommercialOrder = {
  id: string;
  confirmationNumber: string;
  sizeId: string;
  startDate: string;
  endDate: string;
  rentalDays: number;
  price: number;
  status: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  outstandingBalance: number;
  outstandingNote: string | null;
  createdAt: string;
};

export type SerializedCommercialAccount = {
  id: string;
  accountNumber: string;
  status: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  agreedAt: string;
  createdAt: string;
  orders: SerializedCommercialOrder[];
};

const ACCOUNT_STATUSES = ["Active", "Cancelled"] as const;
const ORDER_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"] as const;

const ACCOUNT_STATUS_STYLES: Record<string, string> = {
  Active: "bg-green-50 text-green-700 ring-green-200",
  Cancelled: "bg-gray-100 text-gray-500 ring-gray-200",
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  Completed: "bg-green-50 text-green-700 ring-green-200",
  Cancelled: "bg-gray-100 text-gray-500 ring-gray-200",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function sizeLabel(sizeId: string): string {
  return DUMPSTER_SIZES.find((s) => s.id === sizeId)?.label ?? sizeId;
}

function ordersThisMonth(orders: SerializedCommercialOrder[]): number {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return orders.filter((o) => {
    const d = new Date(o.startDate);
    return (
      d.getUTCFullYear() === year && d.getUTCMonth() === month && o.status !== "Cancelled"
    );
  }).length;
}

export default function AdminCommercialTable({
  initialAccounts,
}: {
  initialAccounts: SerializedCommercialAccount[];
}) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [updatingAccountId, setUpdatingAccountId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(
    initialAccounts[0]?.id ?? null
  );
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null);
  const [balanceDraft, setBalanceDraft] = useState({ amount: "", note: "" });
  const [savingBalance, setSavingBalance] = useState(false);

  const activeAccounts = useMemo(() => accounts.filter((a) => a.status === "Active"), [accounts]);

  async function handleAccountStatusChange(id: string, status: string) {
    setUpdatingAccountId(id);
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
      setUpdatingAccountId(null);
    }
  }

  async function handleOrderStatusChange(accountId: string, orderId: string, status: string) {
    setUpdatingOrderId(orderId);
    const previous = accounts;
    setAccounts((prev) =>
      prev.map((a) =>
        a.id !== accountId
          ? a
          : { ...a, orders: a.orders.map((o) => (o.id === orderId ? { ...o, status } : o)) }
      )
    );
    try {
      const res = await fetch(`/api/admin/commercial-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      setAccounts(previous);
      alert("Couldn't update that order. Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function startEditingBalance(o: SerializedCommercialOrder) {
    setEditingBalanceId(o.id);
    setBalanceDraft({
      amount: o.outstandingBalance ? String(o.outstandingBalance) : "",
      note: o.outstandingNote ?? "",
    });
  }

  async function saveBalance(accountId: string, orderId: string) {
    const amount = Number(balanceDraft.amount) || 0;
    setSavingBalance(true);
    try {
      const res = await fetch(`/api/admin/commercial-orders/${orderId}/balance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outstandingBalance: amount, outstandingNote: balanceDraft.note }),
      });
      if (!res.ok) throw new Error("Update failed");
      const result = await res.json();
      setAccounts((prev) =>
        prev.map((a) =>
          a.id !== accountId
            ? a
            : {
                ...a,
                orders: a.orders.map((o) =>
                  o.id === orderId
                    ? {
                        ...o,
                        outstandingBalance: result.order.outstandingBalance,
                        outstandingNote: result.order.outstandingNote,
                      }
                    : o
                ),
              }
        )
      );
      setEditingBalanceId(null);
    } catch {
      alert("Couldn't save that balance. Please try again.");
    } finally {
      setSavingBalance(false);
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
          <div className="flex flex-wrap items-center gap-2">
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
        <p className="mt-1 text-sm text-gray-500">
          Each account needs at least {COMMERCIAL_MIN_ORDERS_PER_MONTH} orders per calendar month to
          keep the $50-off rate. For a shortfall month, edit that order's balance below to bill the
          difference up to full price.
        </p>

        <div className="mt-8 space-y-4">
          {accounts.length === 0 ? (
            <div className="rounded-2xl bg-white px-5 py-8 text-center text-sm text-gray-400 shadow-sm ring-1 ring-gray-100">
              No commercial accounts yet.
            </div>
          ) : (
            accounts.map((a) => {
              const expanded = expandedId === a.id;
              const thisMonth = ordersThisMonth(a.orders);
              const meetsMinimum = thisMonth >= COMMERCIAL_MIN_ORDERS_PER_MONTH;
              return (
                <div key={a.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                  <button
                    onClick={() => setExpandedId(expanded ? null : a.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <ChevronDown
                        className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                      <div>
                        <p className="font-semibold text-navy">{a.businessName}</p>
                        <p className="font-mono text-xs text-gray-500">{a.accountNumber}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{a.contactName}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                          meetsMinimum ? "bg-green-50 text-green-700 ring-green-200" : "bg-red/10 text-red ring-red/20"
                        }`}
                      >
                        {thisMonth}/{COMMERCIAL_MIN_ORDERS_PER_MONTH} orders this month
                      </span>
                      <select
                        value={a.status}
                        disabled={updatingAccountId === a.id}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleAccountStatusChange(a.id, e.target.value)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 outline-none disabled:opacity-50 ${ACCOUNT_STATUS_STYLES[a.status] ?? ""}`}
                      >
                        {ACCOUNT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-gray-100 px-5 py-4">
                      <div className="grid grid-cols-1 gap-1 text-xs text-gray-500 sm:grid-cols-2">
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {a.phone}
                        </p>
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {a.email}
                        </p>
                        <p className="flex items-start gap-1 sm:col-span-2">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                          {a.street}, {a.city}, {a.state} {a.zip}
                        </p>
                        <p className="sm:col-span-2">Signed up {formatDate(a.createdAt)}</p>
                      </div>

                      <h3 className="mt-4 font-heading text-xs font-bold uppercase tracking-wide text-navy">
                        Orders ({a.orders.length})
                      </h3>
                      {a.orders.length === 0 ? (
                        <p className="mt-2 text-sm text-gray-400">No orders placed yet.</p>
                      ) : (
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full min-w-[820px] text-left text-sm">
                            <thead>
                              <tr className="text-xs uppercase tracking-wide text-gray-400">
                                <th className="py-2 pr-3 font-semibold">Confirmation</th>
                                <th className="py-2 pr-3 font-semibold">Size</th>
                                <th className="py-2 pr-3 font-semibold">Dates</th>
                                <th className="py-2 pr-3 font-semibold">Address</th>
                                <th className="py-2 pr-3 font-semibold">Price</th>
                                <th className="py-2 pr-3 font-semibold">Status</th>
                                <th className="py-2 pr-3 font-semibold">Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {a.orders.map((o) => (
                                <tr key={o.id} className="border-t border-gray-100 align-top">
                                  <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-navy">
                                    {o.confirmationNumber}
                                  </td>
                                  <td className="py-2.5 pr-3 text-gray-600">{sizeLabel(o.sizeId)}</td>
                                  <td className="py-2.5 pr-3 text-xs text-gray-500">
                                    {formatDate(o.startDate)} – {formatDate(o.endDate)}
                                  </td>
                                  <td className="py-2.5 pr-3 text-xs text-gray-500">
                                    {o.street}, {o.city}, {o.state} {o.zip}
                                  </td>
                                  <td className="py-2.5 pr-3 font-semibold text-navy">{formatCurrency(o.price)}</td>
                                  <td className="py-2.5 pr-3">
                                    <select
                                      value={o.status}
                                      disabled={updatingOrderId === o.id}
                                      onChange={(e) => handleOrderStatusChange(a.id, o.id, e.target.value)}
                                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 outline-none disabled:opacity-50 ${ORDER_STATUS_STYLES[o.status] ?? ""}`}
                                    >
                                      {ORDER_STATUSES.map((s) => (
                                        <option key={s} value={s}>
                                          {s}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-2.5 pr-3">
                                    {editingBalanceId === o.id ? (
                                      <div className="w-40 space-y-1.5">
                                        <input
                                          type="number"
                                          min={0}
                                          step="0.01"
                                          autoFocus
                                          value={balanceDraft.amount}
                                          onChange={(e) => setBalanceDraft((d) => ({ ...d, amount: e.target.value }))}
                                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-navy-light"
                                          placeholder="0.00"
                                        />
                                        <input
                                          value={balanceDraft.note}
                                          onChange={(e) => setBalanceDraft((d) => ({ ...d, note: e.target.value }))}
                                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-navy-light"
                                          placeholder="Note (e.g. shortfall penalty)"
                                        />
                                        <div className="flex gap-1.5">
                                          <button
                                            onClick={() => saveBalance(a.id, o.id)}
                                            disabled={savingBalance}
                                            className="rounded bg-navy px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => setEditingBalanceId(null)}
                                            className="rounded px-2 py-1 text-[11px] font-semibold text-gray-500 hover:bg-gray-100"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => startEditingBalance(o)}
                                        className="text-left"
                                        title="Click to edit"
                                      >
                                        <span
                                          className={`text-sm font-semibold ${
                                            o.outstandingBalance > 0 ? "text-red" : "text-gray-400"
                                          }`}
                                        >
                                          {o.outstandingBalance > 0 ? formatCurrency(o.outstandingBalance) : "—"}
                                        </span>
                                        {o.outstandingNote && (
                                          <p className="text-xs text-gray-400">{o.outstandingNote}</p>
                                        )}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
