"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  ChevronDown,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  PlusCircle,
  Send,
  Truck,
} from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import { calculateCommercialPrice, COMMERCIAL_MIN_ORDERS_PER_MONTH } from "@/lib/commercial";
import { DUMPSTER_SIZES, RENTAL_DURATION_OPTIONS } from "@/lib/pricing";
import { formatCurrency, formatPhone, isValidEmail } from "@/lib/format";
import { pickupCountdown, PickupUrgency } from "@/lib/pickup-status";

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
  unitNumber: number | null;
  outstandingBalance: number;
  outstandingNote: string | null;
  invoicedAt: string | null;
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

const ACTIVE_ORDER_STATUSES = new Set(["Pending", "Confirmed"]);

const PICKUP_URGENCY_STYLES: Record<PickupUrgency, string> = {
  upcoming: "bg-gray-100 text-gray-500 ring-gray-200",
  "due-soon": "bg-amber-50 text-amber-700 ring-amber-200",
  overdue: "bg-red/10 text-red ring-red/20",
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

function sizeUnits(sizeId: string): number {
  return DUMPSTER_SIZES.find((s) => s.id === sizeId)?.units ?? 0;
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
  const [accounts, setAccounts] = useState(initialAccounts);
  const [updatingAccountId, setUpdatingAccountId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updatingUnitId, setUpdatingUnitId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(
    initialAccounts[0]?.id ?? null
  );
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null);
  const [balanceDraft, setBalanceDraft] = useState({ amount: "", note: "" });
  const [savingBalance, setSavingBalance] = useState(false);
  const [invoicePanelAccountId, setInvoicePanelAccountId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<{ accountId: string; total: number; sentTo: string } | null>(
    null
  );
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountDraft, setAccountDraft] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "MI",
    zip: "",
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountEditError, setAccountEditError] = useState("");

  const [addOrderAccountId, setAddOrderAccountId] = useState<string | null>(null);
  const [orderDraft, setOrderDraft] = useState({
    sizeId: "",
    deliveryDate: "",
    rentalDays: "" as number | "",
    street: "",
    city: "",
    state: "MI",
    zip: "",
  });
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderCreateError, setOrderCreateError] = useState("");

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

  async function handleOrderUnitChange(accountId: string, orderId: string, value: string) {
    const unitNumber = value === "" ? null : Number(value);
    setUpdatingUnitId(orderId);
    const previous = accounts;
    setAccounts((prev) =>
      prev.map((a) =>
        a.id !== accountId ? a : { ...a, orders: a.orders.map((o) => (o.id === orderId ? { ...o, unitNumber } : o)) }
      )
    );
    try {
      const res = await fetch(`/api/admin/commercial-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitNumber }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Update failed");
    } catch (err) {
      setAccounts(previous);
      alert(err instanceof Error ? err.message : "Couldn't assign that unit. Please try again.");
    } finally {
      setUpdatingUnitId(null);
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

  function openInvoicePanel(a: SerializedCommercialAccount) {
    setInvoiceResult(null);
    if (invoicePanelAccountId === a.id) {
      setInvoicePanelAccountId(null);
      return;
    }
    // Default selection: every non-cancelled order not already invoiced.
    const defaultSelected = a.orders.filter((o) => o.status !== "Cancelled" && !o.invoicedAt).map((o) => o.id);
    setSelectedOrderIds(new Set(defaultSelected));
    setInvoicePanelAccountId(a.id);
  }

  function toggleOrderSelected(orderId: string) {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  async function handleSendInvoice(accountId: string) {
    const orderIds = [...selectedOrderIds];
    if (orderIds.length === 0) {
      alert("Select at least one order to invoice.");
      return;
    }
    setSendingInvoice(true);
    try {
      const res = await fetch(`/api/admin/commercial/${accountId}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Couldn't send the invoice.");
      setAccounts((prev) =>
        prev.map((a) =>
          a.id !== accountId
            ? a
            : {
                ...a,
                orders: a.orders.map((o) =>
                  orderIds.includes(o.id) ? { ...o, invoicedAt: result.invoicedAt } : o
                ),
              }
        )
      );
      setInvoiceResult({ accountId, total: result.total, sentTo: result.sentTo });
      setInvoicePanelAccountId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't send the invoice. Please try again.");
    } finally {
      setSendingInvoice(false);
    }
  }

  function startEditingAccount(a: SerializedCommercialAccount) {
    setAccountEditError("");
    setAccountDraft({
      businessName: a.businessName,
      contactName: a.contactName,
      email: a.email,
      phone: a.phone,
      street: a.street,
      city: a.city,
      state: a.state,
      zip: a.zip,
    });
    setEditingAccountId(a.id);
  }

  async function saveAccountEdit(accountId: string) {
    if (!accountDraft.businessName.trim() || !accountDraft.contactName.trim()) {
      setAccountEditError("Business name and contact name are required.");
      return;
    }
    if (!isValidEmail(accountDraft.email)) {
      setAccountEditError("Enter a valid email address.");
      return;
    }
    if (accountDraft.phone.replace(/\D/g, "").length < 10) {
      setAccountEditError("Enter a valid 10-digit phone number.");
      return;
    }
    if (!/^\d{5}$/.test(accountDraft.zip.trim())) {
      setAccountEditError("Enter a valid 5-digit ZIP code.");
      return;
    }
    setSavingAccount(true);
    setAccountEditError("");
    try {
      const res = await fetch(`/api/admin/commercial/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: accountDraft.businessName.trim(),
          contactName: accountDraft.contactName.trim(),
          email: accountDraft.email.trim(),
          phone: accountDraft.phone.trim(),
          street: accountDraft.street.trim(),
          city: accountDraft.city.trim(),
          state: accountDraft.state.trim(),
          zip: accountDraft.zip.trim(),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Couldn't save those changes.");
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? { ...a, ...result.account } : a)));
      setEditingAccountId(null);
    } catch (err) {
      setAccountEditError(err instanceof Error ? err.message : "Couldn't save those changes. Please try again.");
    } finally {
      setSavingAccount(false);
    }
  }

  function openAddOrderPanel(a: SerializedCommercialAccount) {
    setOrderCreateError("");
    setOrderDraft({
      sizeId: "",
      deliveryDate: "",
      rentalDays: "",
      street: a.street,
      city: a.city,
      state: a.state,
      zip: a.zip,
    });
    setAddOrderAccountId(addOrderAccountId === a.id ? null : a.id);
  }

  async function handleCreateOrder(accountId: string) {
    if (!orderDraft.sizeId || !orderDraft.deliveryDate || !orderDraft.rentalDays) {
      setOrderCreateError("Select a size, delivery date, and duration.");
      return;
    }
    setCreatingOrder(true);
    setOrderCreateError("");
    try {
      const res = await fetch(`/api/admin/commercial/${accountId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sizeId: orderDraft.sizeId,
          deliveryDate: orderDraft.deliveryDate,
          rentalDays: Number(orderDraft.rentalDays),
          street: orderDraft.street.trim(),
          city: orderDraft.city.trim(),
          state: orderDraft.state.trim(),
          zip: orderDraft.zip.trim(),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Couldn't create that order.");
      setAccounts((prev) =>
        prev.map((a) => (a.id === accountId ? { ...a, orders: [result, ...a.orders] } : a))
      );
      setAddOrderAccountId(null);
    } catch (err) {
      setOrderCreateError(err instanceof Error ? err.message : "Couldn't create that order. Please try again.");
    } finally {
      setCreatingOrder(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader icon={Briefcase} subtitle="Commercial Accounts" current="commercial" />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-navy">Commercial Accounts</h1>
            <p className="mt-1 text-sm text-gray-500">
              {accounts.length} total, {activeAccounts.length} active
            </p>
          </div>
          <Link
            href="/admin/commercial/new"
            className="flex items-center gap-1.5 rounded-lg bg-red px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-dark"
          >
            <PlusCircle className="h-4 w-4" /> New Account
          </Link>
        </div>
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
                      {editingAccountId === a.id ? (
                        <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="text-xs font-semibold text-gray-600">
                              Business name
                              <input
                                type="text"
                                value={accountDraft.businessName}
                                onChange={(e) => setAccountDraft((d) => ({ ...d, businessName: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                              />
                            </label>
                            <label className="text-xs font-semibold text-gray-600">
                              Contact name
                              <input
                                type="text"
                                value={accountDraft.contactName}
                                onChange={(e) => setAccountDraft((d) => ({ ...d, contactName: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                              />
                            </label>
                            <label className="text-xs font-semibold text-gray-600">
                              Email
                              <input
                                type="email"
                                value={accountDraft.email}
                                onChange={(e) => setAccountDraft((d) => ({ ...d, email: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                              />
                            </label>
                            <label className="text-xs font-semibold text-gray-600">
                              Phone
                              <input
                                type="tel"
                                value={accountDraft.phone}
                                onChange={(e) => setAccountDraft((d) => ({ ...d, phone: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                              />
                            </label>
                            <label className="text-xs font-semibold text-gray-600 sm:col-span-2">
                              Street
                              <input
                                type="text"
                                value={accountDraft.street}
                                onChange={(e) => setAccountDraft((d) => ({ ...d, street: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                              />
                            </label>
                            <label className="text-xs font-semibold text-gray-600">
                              City
                              <input
                                type="text"
                                value={accountDraft.city}
                                onChange={(e) => setAccountDraft((d) => ({ ...d, city: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                              />
                            </label>
                            <div className="flex gap-3">
                              <label className="w-20 text-xs font-semibold text-gray-600">
                                State
                                <input
                                  type="text"
                                  value={accountDraft.state}
                                  onChange={(e) => setAccountDraft((d) => ({ ...d, state: e.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                                />
                              </label>
                              <label className="flex-1 text-xs font-semibold text-gray-600">
                                ZIP
                                <input
                                  type="text"
                                  value={accountDraft.zip}
                                  onChange={(e) => setAccountDraft((d) => ({ ...d, zip: e.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                                />
                              </label>
                            </div>
                          </div>

                          {accountEditError && (
                            <p className="mt-3 text-xs font-semibold text-red">{accountEditError}</p>
                          )}

                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => saveAccountEdit(a.id)}
                              disabled={savingAccount}
                              className="rounded-lg bg-red px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-dark disabled:opacity-50"
                            >
                              {savingAccount ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                              onClick={() => setEditingAccountId(null)}
                              disabled={savingAccount}
                              className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="grid grid-cols-1 gap-1 text-xs text-gray-500 sm:grid-cols-2">
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {formatPhone(a.phone)}
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
                          <button
                            onClick={() => startEditingAccount(a)}
                            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit Info
                          </button>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-heading text-xs font-bold uppercase tracking-wide text-navy">
                          Orders ({a.orders.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openAddOrderPanel(a)}
                            disabled={a.status !== "Active"}
                            title={a.status !== "Active" ? "Account must be Active to add an order" : undefined}
                            className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200 disabled:opacity-50"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            {addOrderAccountId === a.id ? "Cancel" : "Add Order"}
                          </button>
                          {a.orders.length > 0 && (
                            <button
                              onClick={() => openInvoicePanel(a)}
                              className="flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-light"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {invoicePanelAccountId === a.id ? "Cancel Invoice" : "Send Invoice"}
                            </button>
                          )}
                        </div>
                      </div>

                      {addOrderAccountId === a.id && (
                        <div className="mt-3 rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="text-xs font-semibold text-gray-600">
                              Size
                              <select
                                value={orderDraft.sizeId}
                                onChange={(e) => setOrderDraft((d) => ({ ...d, sizeId: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                              >
                                <option value="">Select a size...</option>
                                {DUMPSTER_SIZES.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="text-xs font-semibold text-gray-600">
                              Rental duration
                              <select
                                value={orderDraft.rentalDays}
                                onChange={(e) =>
                                  setOrderDraft((d) => ({ ...d, rentalDays: e.target.value ? Number(e.target.value) : "" }))
                                }
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                              >
                                <option value="">Select duration...</option>
                                {RENTAL_DURATION_OPTIONS.map((d) => (
                                  <option key={d.days} value={d.days}>
                                    {d.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="text-xs font-semibold text-gray-600">
                              Delivery date
                              <input
                                type="date"
                                value={orderDraft.deliveryDate}
                                onChange={(e) => setOrderDraft((d) => ({ ...d, deliveryDate: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                              />
                            </label>
                            {orderDraft.sizeId && orderDraft.rentalDays && (
                              <div className="flex items-end pb-2 text-xs font-semibold text-navy">
                                Price:{" "}
                                {formatCurrency(
                                  calculateCommercialPrice(
                                    DUMPSTER_SIZES.find((s) => s.id === orderDraft.sizeId)!,
                                    Number(orderDraft.rentalDays)
                                  )
                                )}
                              </div>
                            )}
                            <label className="text-xs font-semibold text-gray-600 sm:col-span-2">
                              Street
                              <input
                                type="text"
                                value={orderDraft.street}
                                onChange={(e) => setOrderDraft((d) => ({ ...d, street: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                              />
                            </label>
                            <label className="text-xs font-semibold text-gray-600">
                              City
                              <input
                                type="text"
                                value={orderDraft.city}
                                onChange={(e) => setOrderDraft((d) => ({ ...d, city: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                              />
                            </label>
                            <div className="flex gap-3">
                              <label className="w-20 text-xs font-semibold text-gray-600">
                                State
                                <input
                                  type="text"
                                  value={orderDraft.state}
                                  onChange={(e) => setOrderDraft((d) => ({ ...d, state: e.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                                />
                              </label>
                              <label className="flex-1 text-xs font-semibold text-gray-600">
                                ZIP
                                <input
                                  type="text"
                                  value={orderDraft.zip}
                                  onChange={(e) => setOrderDraft((d) => ({ ...d, zip: e.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
                                />
                              </label>
                            </div>
                          </div>

                          {orderCreateError && (
                            <p className="mt-3 text-xs font-semibold text-red">{orderCreateError}</p>
                          )}

                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => handleCreateOrder(a.id)}
                              disabled={creatingOrder}
                              className="rounded-lg bg-red px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-dark disabled:opacity-50"
                            >
                              {creatingOrder ? "Creating..." : "Create Order"}
                            </button>
                            <button
                              onClick={() => setAddOrderAccountId(null)}
                              disabled={creatingOrder}
                              className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {invoiceResult && invoiceResult.accountId === a.id && (
                        <div className="mt-3 rounded-lg bg-green-50 px-3.5 py-2.5 text-sm text-green-700 ring-1 ring-green-200">
                          Invoice for {formatCurrency(invoiceResult.total)} emailed to {invoiceResult.sentTo}.
                        </div>
                      )}

                      {invoicePanelAccountId === a.id && (
                        <InvoicePanel
                          account={a}
                          selectedOrderIds={selectedOrderIds}
                          onToggle={toggleOrderSelected}
                          onSend={() => handleSendInvoice(a.id)}
                          onCancel={() => setInvoicePanelAccountId(null)}
                          sending={sendingInvoice}
                        />
                      )}

                      {a.orders.length === 0 ? (
                        <p className="mt-2 text-sm text-gray-400">No orders placed yet.</p>
                      ) : (
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full min-w-[820px] text-left text-sm">
                            <thead>
                              <tr className="text-xs uppercase tracking-wide text-gray-400">
                                <th className="py-2 pr-3 font-semibold">Confirmation</th>
                                <th className="py-2 pr-3 font-semibold">Unit #</th>
                                <th className="py-2 pr-3 font-semibold">Size</th>
                                <th className="py-2 pr-3 font-semibold">Dates</th>
                                <th className="py-2 pr-3 font-semibold">Address</th>
                                <th className="py-2 pr-3 font-semibold">Price</th>
                                <th className="py-2 pr-3 font-semibold">Status</th>
                                <th className="py-2 pr-3 font-semibold">Pickup</th>
                                <th className="py-2 pr-3 font-semibold">Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {a.orders.map((o) => (
                                <tr key={o.id} className="border-t border-gray-100 align-top">
                                  <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-navy">
                                    {o.confirmationNumber}
                                    {o.invoicedAt && (
                                      <p className="mt-0.5 flex items-center gap-1 font-sans text-[11px] font-normal text-gray-400">
                                        <FileText className="h-3 w-3" /> Invoiced {formatDate(o.invoicedAt)}
                                      </p>
                                    )}
                                  </td>
                                  <td className="py-2.5 pr-3">
                                    <select
                                      value={o.unitNumber ?? ""}
                                      disabled={updatingUnitId === o.id}
                                      onChange={(e) => handleOrderUnitChange(a.id, o.id, e.target.value)}
                                      className={`rounded-lg border px-2 py-1 text-xs font-semibold outline-none disabled:opacity-50 ${
                                        o.unitNumber ? "border-navy/20 bg-navy/5 text-navy" : "border-gray-200 text-gray-400"
                                      }`}
                                    >
                                      <option value="">—</option>
                                      {Array.from({ length: sizeUnits(o.sizeId) }, (_, i) => i + 1).map((n) => (
                                        <option key={n} value={n}>
                                          #{n}
                                        </option>
                                      ))}
                                    </select>
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
                                    {ACTIVE_ORDER_STATUSES.has(o.status) ? (
                                      (() => {
                                        const countdown = pickupCountdown(o.endDate);
                                        return (
                                          <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${PICKUP_URGENCY_STYLES[countdown.urgency]}`}
                                          >
                                            {countdown.label}
                                          </span>
                                        );
                                      })()
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
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

function InvoicePanel({
  account,
  selectedOrderIds,
  onToggle,
  onSend,
  onCancel,
  sending,
}: {
  account: SerializedCommercialAccount;
  selectedOrderIds: Set<string>;
  onToggle: (orderId: string) => void;
  onSend: () => void;
  onCancel: () => void;
  sending: boolean;
}) {
  const invoiceable = account.orders.filter((o) => o.status !== "Cancelled");
  const total = invoiceable
    .filter((o) => selectedOrderIds.has(o.id))
    .reduce((sum, o) => sum + o.price + o.outstandingBalance, 0);

  return (
    <div className="mt-3 rounded-xl border border-navy/15 bg-blue-50/40 p-4">
      <p className="text-sm font-medium text-navy">
        Select which orders to bill {account.contactName} at {account.email} for:
      </p>
      {invoiceable.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">No invoiceable orders (all cancelled).</p>
      ) : (
        <div className="mt-3 space-y-2">
          {invoiceable.map((o) => (
            <label
              key={o.id}
              className="flex items-start gap-2.5 rounded-lg bg-white px-3 py-2.5 text-sm ring-1 ring-gray-100"
            >
              <input
                type="checkbox"
                checked={selectedOrderIds.has(o.id)}
                onChange={() => onToggle(o.id)}
                className="mt-0.5 h-4 w-4 accent-navy"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-navy">
                    {sizeLabel(o.sizeId)} — {o.confirmationNumber}
                  </span>
                  <span className="font-semibold text-navy">
                    {formatCurrency(o.price + o.outstandingBalance)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {formatDate(o.startDate)}
                  {o.outstandingBalance > 0 && ` · +${formatCurrency(o.outstandingBalance)} additional`}
                  {o.invoicedAt && ` · already invoiced ${formatDate(o.invoicedAt)}`}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-navy/10 pt-3">
        <p className="text-sm font-semibold text-navy">
          Total: <span className="font-heading text-base">{formatCurrency(total)}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-3.5 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            disabled={sending || selectedOrderIds.size === 0}
            className="flex items-center gap-1.5 rounded-lg bg-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> {sending ? "Sending…" : "Send Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
