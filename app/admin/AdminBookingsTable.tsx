"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, MapPin, Phone, Trash2 } from "lucide-react";
import { COMPANY } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";
import { DumpsterSizeOption } from "@/lib/types";

export type SerializedBooking = {
  id: string;
  confirmationNumber: string;
  sizeId: string;
  startDate: string;
  endDate: string;
  rentalDays: number;
  price: number;
  status: string;
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  pinLat: number | null;
  pinLng: number | null;
  cardBrand: string | null;
  cardLast4: string | null;
  createdAt: string;
};

const STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"] as const;
const ACTIVE_STATUSES = new Set(["Pending", "Confirmed"]);

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  Completed: "bg-green-50 text-green-700 ring-green-200",
  Cancelled: "bg-gray-100 text-gray-500 ring-gray-200",
};

function formatDate(iso: string): string {
  // Stored as UTC midnight for a calendar date with no timezone attached —
  // format in UTC too, or viewers behind UTC would see the date shifted
  // back by a day (e.g. a Sep 1 delivery showing as Aug 31).
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function AdminBookingsTable({
  initialBookings,
  sizes,
}: {
  initialBookings: SerializedBooking[];
  sizes: DumpsterSizeOption[];
}) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return sizes.map((size) => ({
      size,
      bookings: bookings
        .filter((b) => b.sizeId === size.id)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    }));
  }, [bookings, sizes]);

  async function handleStatusChange(id: string, status: string) {
    setUpdatingId(id);
    const previous = bookings;
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      setBookings(previous); // roll back on failure
      alert("Couldn't update that booking's status. Please try again.");
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
              <Trash2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold leading-tight">{COMPANY.name}</p>
              <p className="text-xs text-white/70">Bookings Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold transition hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl font-bold text-navy">All Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          {bookings.length} total, {bookings.filter((b) => ACTIVE_STATUSES.has(b.status)).length} active
        </p>

        <div className="mt-8 space-y-8">
          {grouped.map(({ size, bookings: sizeBookings }) => {
            const activeCount = sizeBookings.filter((b) => ACTIVE_STATUSES.has(b.status)).length;
            return (
              <section key={size.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-5 py-3.5">
                  <h2 className="font-heading text-base font-bold text-navy">{size.label}</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                      activeCount >= size.units
                        ? "bg-red/10 text-red ring-red/20"
                        : "bg-green-50 text-green-700 ring-green-200"
                    }`}
                  >
                    {activeCount} / {size.units} unit{size.units === 1 ? "" : "s"} booked
                  </span>
                </div>

                {sizeBookings.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-gray-400">No bookings for this size yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-wide text-gray-400">
                          <th className="px-5 py-2.5 font-semibold">Confirmation</th>
                          <th className="px-5 py-2.5 font-semibold">Customer</th>
                          <th className="px-5 py-2.5 font-semibold">Dates</th>
                          <th className="px-5 py-2.5 font-semibold">Price</th>
                          <th className="px-5 py-2.5 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizeBookings.map((b) => (
                          <tr key={b.id} className="border-t border-gray-100 align-top">
                            <td className="px-5 py-3 font-mono text-xs font-semibold text-navy">
                              {b.confirmationNumber}
                            </td>
                            <td className="px-5 py-3">
                              <p className="font-semibold text-navy">{b.fullName}</p>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="h-3 w-3" /> {b.phone}
                              </p>
                              <p className="text-xs text-gray-500">{b.email}</p>
                              <p className="mt-0.5 flex items-start gap-1 text-xs text-gray-500">
                                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                                {b.street}, {b.city}, {b.state} {b.zip}
                              </p>
                            </td>
                            <td className="px-5 py-3 text-gray-600">
                              {formatDate(b.startDate)} – {formatDate(b.endDate)}
                              <p className="text-xs text-gray-400">{b.rentalDays} days</p>
                            </td>
                            <td className="px-5 py-3 font-semibold text-navy">{formatCurrency(b.price)}</td>
                            <td className="px-5 py-3">
                              <select
                                value={b.status}
                                disabled={updatingId === b.id}
                                onChange={(e) => handleStatusChange(b.id, e.target.value)}
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 outline-none disabled:opacity-50 ${STATUS_STYLES[b.status] ?? ""}`}
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
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
