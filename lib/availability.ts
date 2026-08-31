import { db } from "./db";
import { calculatePrice, DUMPSTER_SIZES } from "./pricing";

/** Booking statuses that still hold an inventory slot. */
export const ACTIVE_STATUSES = ["Pending", "Confirmed"] as const;

/**
 * Adds `days` to `date` using UTC calendar arithmetic. Delivery dates come
 * in as plain "YYYY-MM-DD" strings with no timezone, which `new Date(...)`
 * parses as UTC midnight — using local-time getters/setters here (e.g. plain
 * `.setDate()`) would silently shift the result by a day on servers or
 * browsers running behind UTC. Keeping everything UTC keeps these dates
 * meaning the same calendar day everywhere.
 */
export function addDaysUTC(date: Date, days: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + days,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    )
  );
}

/** Adds `rentalDays` to a delivery date to get the return/pickup date. */
export function computeEndDate(startDate: Date, rentalDays: number): Date {
  return addDaysUTC(startDate, rentalDays);
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

/**
 * Finds the soonest delivery date on/after `fromDate` where `sizeId` has a
 * free unit for the full `rentalDays` window. Pulls every active booking
 * that could overlap the search window in one query, then checks candidate
 * start dates against that in-memory list day by day — cheap since a small
 * dumpster business has few concurrent bookings per size, and avoids one DB
 * round-trip per day searched.
 */
export async function findNextAvailableDate(
  sizeId: string,
  rentalDays: number,
  fromDate: Date,
  maxDaysToSearch = 90
): Promise<Date | null> {
  const size = DUMPSTER_SIZES.find((s) => s.id === sizeId);
  if (!size) return null;

  const searchWindowEnd = addDaysUTC(fromDate, maxDaysToSearch + rentalDays);
  const bookings = await db.booking.findMany({
    where: {
      sizeId,
      status: { in: [...ACTIVE_STATUSES] },
      startDate: { lt: searchWindowEnd },
      endDate: { gt: fromDate },
    },
    select: { startDate: true, endDate: true },
  });

  for (let offset = 0; offset <= maxDaysToSearch; offset++) {
    const candidateStart = addDaysUTC(fromDate, offset);
    const candidateEnd = computeEndDate(candidateStart, rentalDays);
    const overlapping = bookings.filter(
      (b) => b.startDate < candidateEnd && b.endDate > candidateStart
    ).length;
    if (overlapping < size.units) return candidateStart;
  }
  return null;
}

export type AlternativeSize = {
  sizeId: string;
  label: string;
  price: number;
  unitsTotal: number;
  unitsBooked: number;
};

/**
 * Of every OTHER dumpster size, which ones have a free unit for the exact
 * same delivery date + duration the customer already picked — so a sold-out
 * size can offer "this one's open for those same dates instead" rather than
 * just a dead end.
 */
export async function findAvailableAlternativeSizes(
  excludeSizeId: string,
  startDate: Date,
  endDate: Date,
  rentalDays: number
): Promise<AlternativeSize[]> {
  const others = DUMPSTER_SIZES.filter((s) => s.id !== excludeSizeId);
  const results: AlternativeSize[] = [];
  for (const size of others) {
    const { available, unitsTotal, unitsBooked } = await checkAvailability(size.id, startDate, endDate);
    if (available) {
      results.push({
        sizeId: size.id,
        label: size.label,
        price: calculatePrice(size, rentalDays),
        unitsTotal,
        unitsBooked,
      });
    }
  }
  return results;
}
