/**
 * Pure date math for "how long until this rental is due back" — safe to
 * import from client components (no server-only imports), unlike
 * lib/availability.ts which pulls in the Prisma client.
 */
export type PickupUrgency = "upcoming" | "due-soon" | "overdue";

export type PickupCountdown = { label: string; urgency: PickupUrgency };

/**
 * `endDateIso` is stored as UTC midnight of the calendar pickup day (see
 * lib/availability.ts's computeEndDate) — compare by UTC calendar day, not
 * elapsed milliseconds, so "today" means today everywhere regardless of the
 * viewer's timezone or time of day.
 */
export function pickupCountdown(endDateIso: string, now: Date = new Date()): PickupCountdown {
  const end = new Date(endDateIso);
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const nowDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diffDays = Math.round((endDay - nowDay) / 86_400_000);

  if (diffDays > 1) return { label: `Due in ${diffDays}d`, urgency: "upcoming" };
  if (diffDays === 1) return { label: "Due tomorrow", urgency: "due-soon" };
  if (diffDays === 0) return { label: "Ready for pickup", urgency: "due-soon" };
  return { label: `Overdue ${Math.abs(diffDays)}d`, urgency: "overdue" };
}
