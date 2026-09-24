import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { isUnitNumberTaken } from "@/lib/availability";
import { DUMPSTER_SIZES } from "@/lib/pricing";

const VALID_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status: unknown = body?.status;
  const hasUnitNumber = body && Object.prototype.hasOwnProperty.call(body, "unitNumber");
  const unitNumber: unknown = body?.unitNumber;

  const data: { status?: string; unitNumber?: number | null } = {};

  if (status !== undefined) {
    if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }
    data.status = status;
  }

  if (hasUnitNumber) {
    if (unitNumber === null) {
      data.unitNumber = null;
    } else {
      const existing = await db.commercialOrder.findUnique({ where: { id }, select: { sizeId: true } });
      if (!existing) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }
      const size = DUMPSTER_SIZES.find((s) => s.id === existing.sizeId);
      const n = Number(unitNumber);
      if (!size || !Number.isInteger(n) || n < 1 || n > size.units) {
        return NextResponse.json(
          { error: `unitNumber must be an integer between 1 and ${size?.units ?? "?"}.` },
          { status: 400 }
        );
      }
      if (await isUnitNumberTaken(existing.sizeId, n, undefined, id)) {
        return NextResponse.json(
          { error: `Unit #${n} is already assigned to another active order of this size.` },
          { status: 409 }
        );
      }
      data.unitNumber = n;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const order = await db.commercialOrder.update({ where: { id }, data });
    return NextResponse.json({ order });
  } catch (err) {
    console.error("Failed to update commercial order:", err);
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.commercialOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete commercial order:", err);
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
}
