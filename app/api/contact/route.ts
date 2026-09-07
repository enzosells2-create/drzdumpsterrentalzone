import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newContactMessageOwnerEmail, OWNER_EMAIL, sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name: unknown = body?.name;
  const email: unknown = body?.email;
  const phone: unknown = body?.phone;
  const confirmationNumber: unknown = body?.confirmationNumber;
  const message: unknown = body?.message;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const contact = await db.contactMessage.create({
    data: {
      name: name.trim(),
      email: email.trim(),
      phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
      confirmationNumber:
        typeof confirmationNumber === "string" && confirmationNumber.trim()
          ? confirmationNumber.trim()
          : null,
      message: message.trim(),
    },
  });

  // Best-effort — a failed notification shouldn't stop the message from
  // being recorded; the owner can still see it in /admin/messages.
  const notice = newContactMessageOwnerEmail({
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    confirmationNumber: contact.confirmationNumber,
    message: contact.message,
  });
  await sendEmail({ to: OWNER_EMAIL, ...notice });

  return NextResponse.json({ ok: true });
}
