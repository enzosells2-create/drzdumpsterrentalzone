"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, LogOut, MapPin, PackageCheck, Truck } from "lucide-react";
import { COMPANY, DUMPSTER_SIZES } from "@/lib/pricing";
import { ScheduleEvent } from "./page";

function sizeLabel(sizeId: string): string {
  return DUMPSTER_SIZES.find((s) => s.id === sizeId)?.label ?? sizeId;
}

function dayKey(iso: string): string {
  return iso.split("T")[0];
}

function formatDayHeading(dayIso: string): string {
  const date = new Date(`${dayIso}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const TODAY = new Date().toISOString().split("T")[0];

export default function EmployeeSchedule({ events }: { events: ScheduleEvent[] }) {
  const router = useRouter();

  const days = useMemo(() => {
    const groups = new Map<string, ScheduleEvent[]>();
    for (const e of events) {
      const key = dayKey(e.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  async function handleLogout() {
    await fetch("/api/employee/logout", { method: "POST" });
    router.push("/employee/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b-[3px] border-red bg-gradient-to-br from-navy to-navy-light text-white shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-red to-red-dark sm:h-10 sm:w-10">
              <Truck className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-heading text-base font-bold leading-tight sm:text-lg">{COMPANY.name}</p>
              <p className="truncate text-xs text-white/70">Delivery Schedule</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="font-heading text-xl font-bold text-navy sm:text-2xl">Upcoming Deliveries &amp; Pickups</h1>
        <p className="mt-1 text-sm text-gray-500">
          {events.length === 0 ? "Nothing scheduled." : `${events.length} stop${events.length === 1 ? "" : "s"} across ${days.length} day${days.length === 1 ? "" : "s"}.`}
        </p>

        <div className="mt-6 space-y-6">
          {days.length === 0 ? (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-gray-400 shadow-sm ring-1 ring-gray-100">
              No deliveries or pickups scheduled right now.
            </div>
          ) : (
            days.map(([day, dayEvents]) => (
              <div key={day}>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-navy">
                    {formatDayHeading(day)}
                  </h2>
                  {day === TODAY && (
                    <span className="rounded-full bg-red px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                      Today
                    </span>
                  )}
                </div>
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                  {dayEvents.map((e, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-gray-100" : ""}`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          e.type === "Delivery" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {e.type === "Delivery" ? <Truck className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-xs font-bold uppercase tracking-wide ${
                              e.type === "Delivery" ? "text-blue-600" : "text-amber-600"
                            }`}
                          >
                            {e.type}
                          </span>
                          <span className="font-semibold text-navy">
                            {sizeLabel(e.sizeId)}
                            {e.unitNumber && <span className="text-gray-400"> #{e.unitNumber}</span>}
                          </span>
                          {e.commercial && (
                            <span className="flex items-center gap-1 rounded-full bg-navy/5 px-2 py-0.5 text-[11px] font-semibold text-navy">
                              <Briefcase className="h-3 w-3" /> Commercial
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 flex items-start gap-1 text-sm text-gray-600">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                          {e.address}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
