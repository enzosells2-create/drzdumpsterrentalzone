import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { DUMPSTER_SIZES } from "@/lib/pricing";
import { deliveredEmail, pickedUpEmail, sendEmail, thankYouEmail } from "@/lib/email";

const STAGE_FIELDS = {
  delivered: "deliveredAt",
  pickedUp: "pickedUpAt",
  thankYou: "thankYouSentAt",
} as const;

type Stage = keyof typeof STAGE_FIELDS;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const stage: unknown = body?.stage;

  if (typeof stage !== "string" || !(stage in STAGE_FIELDS)) {
    return NextResponse.json(
      { error: `stage must be one of: ${Object.keys(STAGE_FIELDS).join(", ")}` },
      { status: 400 }
    );
  }

  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const field = STAGE_FIELDS[stage as Stage];

  // Idempotent — re-clicking an already-sent stage doesn't resend the email.
  if (booking[field]) {
    return NextResponse.json({ booking });
  }

  const updated = await db.booking.update({
    where: { id },
    data: { [field]: new Date() },
  });

  const sizeLabel = DUMPSTER_SIZES.find((s) => s.id === booking.sizeId)?.label ?? booking.sizeId;
  const address = `${booking.street}, ${booking.city}, ${booking.state} ${booking.zip}`;

  let notice: { subject: string; html: string };
  if (stage === "delivered") {
    notice = deliveredEmail(booking.fullName, sizeLabel, address);
  } else if (stage === "pickedUp") {
    notice = pickedUpEmail(booking.fullName, sizeLabel);
  } else {
    notice = thankYouEmail(booking.fullName);
  }

  // Best-effort — the stage is already recorded even if the email fails.
  await sendEmail({ to: booking.email, ...notice });

  return NextResponse.json({ booking: updated });
}
