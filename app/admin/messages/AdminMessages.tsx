"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Mail, MessageSquare, Phone, Tag } from "lucide-react";
import { COMPANY } from "@/lib/pricing";

export type SerializedMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  confirmationNumber: string | null;
  message: string;
  status: string;
  createdAt: string;
};

const STATUSES = ["New", "Read", "Resolved"] as const;

const STATUS_STYLES: Record<string, string> = {
  New: "bg-red/10 text-red ring-red/20",
  Read: "bg-amber-50 text-amber-700 ring-amber-200",
  Resolved: "bg-green-50 text-green-700 ring-green-200",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminMessages({ initialMessages }: { initialMessages: SerializedMessage[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const newCount = messages.filter((m) => m.status === "New").length;

  async function handleStatusChange(id: string, status: string) {
    setUpdatingId(id);
    const previous = messages;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      setMessages(previous);
      alert("Couldn't update that message. Please try again.");
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
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold leading-tight">{COMPANY.name}</p>
              <p className="text-xs text-white/70">Messages</p>
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

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl font-bold text-navy">Messages</h1>
        <p className="mt-1 text-sm text-gray-500">
          {messages.length} total, {newCount} new
        </p>

        <div className="mt-6 space-y-4">
          {messages.length === 0 ? (
            <p className="rounded-2xl bg-white px-5 py-8 text-center text-sm text-gray-400 shadow-sm ring-1 ring-gray-100">
              No messages yet.
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">{m.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <Mail className="h-3 w-3" /> {m.email}
                    </p>
                    {m.phone && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="h-3 w-3" /> {m.phone}
                      </p>
                    )}
                    {m.confirmationNumber && (
                      <p className="mt-0.5 font-mono text-xs text-gray-400">
                        Re: {m.confirmationNumber}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatDate(m.createdAt)}</span>
                    <select
                      value={m.status}
                      disabled={updatingId === m.id}
                      onChange={(e) => handleStatusChange(m.id, e.target.value)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 outline-none disabled:opacity-50 ${STATUS_STYLES[m.status] ?? ""}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{m.message}</p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
