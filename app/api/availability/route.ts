import { NextRequest, NextResponse } from "next/server";
import { checkAvailability, computeEndDate } from "@/lib/availability";

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
  return NextResponse.json(result);
}
