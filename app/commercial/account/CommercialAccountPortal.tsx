"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Mail, MapPin, Phone, PlusCircle } from "lucide-react";
import Header from "@/components/Header";
import { COMMERCIAL_MIN_ORDERS_PER_MONTH } from "@/lib/commercial";
import { DUMPSTER_SIZES } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";

type Order = {
  id: string;
  confirmationNumber: string;
  sizeId: string;
  startDate: string;
  endDate: string;
  price: number;
  status: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  outstandingBalance: number;
  outstandingNote: string | null;
};

type Account = {
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
  createdAt: string;
  orders: Order[];
};

const STATUS_STYLES: Record<string, string> = {
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

function ordersThisMonth(orders: Order[]): number {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return orders.filter((o) => {
    const d = new Date(o.startDate);
    return d.getUTCFullYear() === year && d.getUTCMonth() === month && o.status !== "Cancelled";
  }).length;
}

export default function CommercialAccountPortal({ account }: { account: Account }) {
  const router = useRouter();
  const thisMonth = ordersThisMonth(account.orders);
  const meetsMinimum = thisMonth >= COMMERCIAL_MIN_ORDERS_PER_MONTH;
  const totalOwed = account.orders.reduce((sum, o) => sum + o.outstandingBalance, 0);

  async function handleLogout() {
    await fetch("/api/commercial/logout", { method: "POST" });
    router.push("/commercial/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-navy sm:text-3xl">{account.businessName}</h1>
            <p className="mt-1 font-mono text-sm text-gray-500">{account.accountNumber}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full bg-navy px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-navy-light"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Account status"
            value={account.status}
            valueClassName={account.status === "Active" ? "text-green-600" : "text-gray-500"}
          />
          <StatCard
            label="Orders this month"
            value={`${thisMonth}/${COMMERCIAL_MIN_ORDERS_PER_MONTH}`}
            valueClassName={meetsMinimum ? "text-green-600" : "text-red"}
          />
          <StatCard
            label="Outstanding balance"
            value={totalOwed > 0 ? formatCurrency(totalOwed) : "$0.00"}
            valueClassName={totalOwed > 0 ? "text-red" : "text-navy"}
          />
        </div>

        {!meetsMinimum && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200">
            You&apos;re below the {COMMERCIAL_MIN_ORDERS_PER_MONTH}-order monthly minimum for the $50-off
            rate this month — orders placed this month may be billed at full price.
          </p>
        )}

        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-heading text-xs font-bold uppercase tracking-wide text-navy">Account Info</h2>
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <p>{account.contactName}</p>
            <p className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0" /> {account.phone}
            </p>
            <p className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 shrink-0" /> {account.email}
            </p>
            <p className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {account.street}, {account.city}, {account.state} {account.zip}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-navy">Orders ({account.orders.length})</h2>
          <Link
            href={`/commercial/order?account=${encodeURIComponent(account.accountNumber)}`}
            className="flex items-center gap-1.5 rounded-lg bg-red px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-dark"
          >
            <PlusCircle className="h-4 w-4" /> Place New Order
          </Link>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          {account.orders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">
              No orders yet — place your first one above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-2.5 font-semibold">Confirmation</th>
                    <th className="px-5 py-2.5 font-semibold">Size</th>
                    <th className="px-5 py-2.5 font-semibold">Dates</th>
                    <th className="px-5 py-2.5 font-semibold">Price</th>
                    <th className="px-5 py-2.5 font-semibold">Status</th>
                    <th className="px-5 py-2.5 font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {account.orders.map((o) => (
                    <tr key={o.id} className="border-t border-gray-100 align-top">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-navy">
                        {o.confirmationNumber}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{sizeLabel(o.sizeId)}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {formatDate(o.startDate)} – {formatDate(o.endDate)}
                        <p className="text-gray-400">
                          {o.street}, {o.city}, {o.state} {o.zip}
                        </p>
                      </td>
                      <td className="px-5 py-3 font-semibold text-navy">{formatCurrency(o.price)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS_STYLES[o.status] ?? ""}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`font-semibold ${o.outstandingBalance > 0 ? "text-red" : "text-gray-400"}`}>
                          {o.outstandingBalance > 0 ? formatCurrency(o.outstandingBalance) : "—"}
                        </span>
                        {o.outstandingNote && <p className="text-xs text-gray-400">{o.outstandingNote}</p>}
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

function StatCard({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 font-heading text-xl font-extrabold ${valueClassName}`}>{value}</p>
    </div>
  );
}
