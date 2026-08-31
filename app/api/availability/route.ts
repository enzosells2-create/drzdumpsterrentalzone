import { NextRequest, NextResponse } from "next/server";
import {
  checkAvailability,
  computeEndDate,
  findAvailableAlternativeSizes,
  findNextAvailableDate,
} from "@/lib/availability";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const sizeId: unknown = body?.sizeId;
  const deliveryDate: unknown = body?.deliveryDate;
  const rentalDays: unknown = body?.rentalDays;

  if (typeof sizeId !== "string" || typeof deliveryDate !== "string" || typeof rentalDays !== "number") {
    return NextResponse.json(
      { error: "Missing or invalid sizeId, deliveryDate, or rentalDays." },
      { status: 400 }
    );
  }

  const startDate = new Date(deliveryDate);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Invalid delivery date." }, { status: 400 });
  }

  const endDate = computeEndDate(startDate, rentalDays);
  const result = await checkAvailability(sizeId, startDate, endDate);

  if (result.available) {
    return NextResponse.json(result);
  }

  // Sold out for what they asked for — look up alternatives in parallel so
  // the customer isn't just stuck with a dead end.
  const [nextAvailableDate, alternativeSizes] = await Promise.all([
    findNextAvailableDate(sizeId, rentalDays, startDate),
    findAvailableAlternativeSizes(sizeId, startDate, endDate, rentalDays),
  ]);

  return NextResponse.json({
    ...result,
    nextAvailableDate: nextAvailableDate ? nextAvailableDate.toISOString().split("T")[0] : null,
    alternativeSizes,
  });
}
