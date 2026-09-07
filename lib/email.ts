import { Resend } from "resend";
import { COMPANY } from "./pricing";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// The address customer/owner notifications appear to come from. Until a
// domain is verified in Resend, Resend only allows sending from its own
// onboarding@resend.dev address (and only to the account's own signup
// email) — see the note in .env.local.example.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "DRZ Dumpster Rental <onboarding@resend.dev>";

// Where the owner's own alerts (new booking, new contact message) go.
export const OWNER_EMAIL = process.env.OWNER_NOTIFICATION_EMAIL || "drzdumpsterrentalzone@gmail.com";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Sends an email via Resend. Never throws — a notification failing to send
 * should never break the booking flow or admin action that triggered it.
 * Returns whether it actually sent, so callers can decide whether to retry
 * or just log it.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — skipped email to ${to}: "${subject}"`);
    return false;
  }
  try {
    const result = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
    if (result.error) {
      console.error("Resend returned an error:", result.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to send email:", err);
    return false;
  }
}

function wrapper(bodyHtml: string): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #0f2247, #1e3a6e); padding: 24px; border-radius: 12px 12px 0 0;">
        <span style="display:inline-block; background:#ef4444; color:#fff; font-weight:800; padding:8px 12px; border-radius:8px; font-size:16px;">DRZ</span>
        <span style="color:#fff; font-weight:700; font-size:18px; margin-left:10px;">${COMPANY.name}</span>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        ${bodyHtml}
        <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">
          Questions? Call us at <a href="${COMPANY.phoneHref}" style="color:#ef4444;">${COMPANY.phone}</a>.
        </p>
      </div>
    </div>
  `;
}

export function deliveredEmail(customerName: string, sizeLabel: string, street: string): { subject: string; html: string } {
  return {
    subject: `Your ${sizeLabel} dumpster has been delivered`,
    html: wrapper(`
      <p>Hi ${customerName},</p>
      <p>Your <strong>${sizeLabel}</strong> dumpster has been delivered to <strong>${street}</strong>.</p>
      <p>Once you're finished, just give us a call and we'll schedule the pickup.</p>
    `),
  };
}

export function pickedUpEmail(customerName: string, sizeLabel: string): { subject: string; html: string } {
  return {
    subject: `Your ${sizeLabel} dumpster has been picked up`,
    html: wrapper(`
      <p>Hi ${customerName},</p>
      <p>Your <strong>${sizeLabel}</strong> dumpster has been picked up. Your rental is now complete.</p>
    `),
  };
}

export function thankYouEmail(customerName: string): { subject: string; html: string } {
  return {
    subject: `Thank you for choosing ${COMPANY.name}!`,
    html: wrapper(`
      <p>Hi ${customerName},</p>
      <p>Thank you for using ${COMPANY.name} for your dumpster rental! We hope everything went smoothly.</p>
      <p>If you ever need another dumpster, we'd love to help again.</p>
    `),
  };
}

export function newBookingOwnerEmail(details: {
  confirmationNumber: string;
  sizeLabel: string;
  customerName: string;
  phone: string;
  address: string;
  deliveryDate: string;
  price: number;
}): { subject: string; html: string } {
  return {
    subject: `New booking: ${details.sizeLabel} — ${details.customerName}`,
    html: wrapper(`
      <p>New booking received:</p>
      <ul>
        <li><strong>Confirmation:</strong> ${details.confirmationNumber}</li>
        <li><strong>Size:</strong> ${details.sizeLabel}</li>
        <li><strong>Customer:</strong> ${details.customerName} (${details.phone})</li>
        <li><strong>Address:</strong> ${details.address}</li>
        <li><strong>Delivery date:</strong> ${details.deliveryDate}</li>
        <li><strong>Price:</strong> $${details.price.toFixed(2)}</li>
      </ul>
    `),
  };
}

export function newContactMessageOwnerEmail(details: {
  name: string;
  email: string;
  phone: string | null;
  confirmationNumber: string | null;
  message: string;
}): { subject: string; html: string } {
  return {
    subject: `New contact message from ${details.name}`,
    html: wrapper(`
      <p>New message from the Contact Us form:</p>
      <ul>
        <li><strong>Name:</strong> ${details.name}</li>
        <li><strong>Email:</strong> ${details.email}</li>
        ${details.phone ? `<li><strong>Phone:</strong> ${details.phone}</li>` : ""}
        ${details.confirmationNumber ? `<li><strong>Confirmation #:</strong> ${details.confirmationNumber}</li>` : ""}
      </ul>
      <p style="white-space: pre-wrap;">${details.message}</p>
    `),
  };
}
