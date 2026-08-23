import { db } from "./db";
import { DUMPSTER_SIZES } from "./pricing";

/** Booking statuses that still hold an inventory slot. */
export const ACTIVE_STATUSES = ["Pending", "Confirmed"] as const;

/**
 * Adds `rentalDays` to `startDate` using UTC calendar arithmetic. Delivery
 * dates come in as plain "YYYY-MM-DD" strings with no timezone, which
 * `new Date(...)` parses as UTC midnight — using local-time getters/setters
 * here (e.g. plain `.setDate()`) would silently shift the result by a day
 * on servers or browsers running behind UTC. Keeping everything UTC keeps
 * these dates meaning the same calendar day everywhere.
 */
export function computeEndDate(startDate: Date, rentalDays: number): Date {
  return new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate() + rentalDays,
      startDate.getUTCHours(),
      startDate.getUTCMinutes(),
      startDate.getUTCSeconds()
    )
  );
}

/** How many units of `sizeId` are already reserved over [startDate, endDate). */
export async function countOverlapping(
  sizeId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
): Promise<number> {
  return db.booking.count({
    where: {
      sizeId,
      status: { in: [...ACTIVE_STATUSES] },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
  });
}

export type AvailabilityResult = {
  available: boolean;
  unitsTotal: number;
  unitsBooked: number;
};

export async function checkAvailability(
  sizeId: string,
  startDate: Date,
  endDate: Date
): Promise<AvailabilityResult> {
  const size = DUMPSTER_SIZES.find((s) => s.id === sizeId);
  const unitsTotal = size?.units ?? 0;
  const unitsBooked = await countOverlapping(sizeId, startDate, endDate);
  return { available: unitsBooked < unitsTotal, unitsTotal, unitsBooked };
}
