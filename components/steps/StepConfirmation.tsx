import { MapPin, Phone } from "lucide-react";
import { BookingData } from "@/lib/types";
import { COMPANY, getDurationLabel, TAX_RATE } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";

type Props = {
  data: BookingData;
  confirmationNumber: string;
  onReset: () => void;
};

const NEXT_STEPS = [
  "📧 Confirmation email sent to your email address",
  "📞 We'll call to confirm delivery time (usually within 24 hours)",
  "🚚 Dumpster delivered at scheduled time",
  "📍 Placed at the location you pinpointed on the map",
  "🔄 Automatic pickup at end of rental period",
];

export default function StepConfirmation({ data, confirmationNumber, onReset }: Props) {
  const basePrice = data.price ?? 0;
  const discount = data.discountAmount ?? 0;
  const subtotal = Math.round((basePrice - discount) * 100) / 100;
  const totalPaid = Math.round((subtotal + subtotal * TAX_RATE) * 100) / 100;

  const deliveryDateLabel = data.deliveryDate
    ? new Date(data.deliveryDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
      <div className="text-6xl">✅</div>
      <h2 className="mt-4 font-heading text-3xl font-extrabold text-green-600">
        Booking Confirmed!
      </h2>
      <p className="mt-2 text-gray-600">Your dumpster rental has been successfully scheduled</p>

      <div className="mt-8 space-y-3 rounded-lg border-2 border-navy bg-blue-50/60 p-6 text-left">
        <h3 className="font-heading text-base font-bold text-navy">Confirmation Details</h3>
        <SummaryRow label="Confirmation #" value={confirmationNumber} strong />
        <SummaryRow
          label={data.size?.label ?? "Dumpster"}
          value={data.price !== null ? formatCurrency(data.price) : "—"}
        />
        {data.promoCode && data.discountAmount && (
          <SummaryRow
            label={`Promo ${data.promoCode} applied`}
            value={`-${formatCurrency(data.discountAmount)}`}
          />
        )}
        <SummaryRow
          label="Delivery Address"
          value={`${data.street}, ${data.city}, ${data.state} ${data.zip}`}
        />
        <SummaryRow label="Delivery Date" value={deliveryDateLabel} />
        <SummaryRow
          label="Rental Duration"
          value={data.rentalDays ? getDurationLabel(data.rentalDays) : "—"}
        />
        <SummaryRow
          label="Pinned Location"
          value={
            data.pinLat !== null && data.pinLng !== null
              ? `${data.pinLat.toFixed(6)}, ${data.pinLng.toFixed(6)}`
              : "—"
          }
          icon={<MapPin className="h-4 w-4 text-red" />}
        />
        <SummaryRow
          label="Total Paid"
          value={
            data.cardLast4
              ? `${formatCurrency(totalPaid)} · ${data.cardBrand} •••• ${data.cardLast4}`
              : "—"
          }
          last
        />
      </div>

      <div className="mt-6 rounded-lg bg-blue-50/60 p-5 text-left">
        <h3 className="mb-3 font-heading text-base font-bold text-navy">What Happens Next?</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          {NEXT_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-left">
        <p className="text-sm font-semibold text-amber-800">📋 Save Your Confirmation Number</p>
        <p className="mt-1 text-xs text-amber-700">
          You can use this to track your rental or modify your booking.
        </p>
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <p className="text-sm text-gray-600">Need help? Contact us anytime:</p>
        <a
          href={COMPANY.phoneHref}
          className="mt-2 flex items-center justify-center gap-2 text-xl font-bold text-red hover:text-red-dark"
        >
          <Phone className="h-5 w-5" /> {COMPANY.phone}
        </a>
        <p className="mt-1 text-xs text-gray-400">Available 24/7 for support</p>
      </div>

      <button
        onClick={onReset}
        className="mt-8 text-sm font-semibold text-navy underline underline-offset-4 hover:text-red"
      >
        Start a New Booking
      </button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  icon,
  strong = false,
  last = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  strong?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between text-sm ${
        last ? "border-t border-gray-200 pt-3 font-bold text-red" : "border-b border-gray-200 pb-2"
      }`}
    >
      <span className={last ? "" : "text-gray-500"}>{label}</span>
      <span
        className={`flex items-center gap-1.5 ${
          strong ? "font-bold text-red" : last ? "" : "font-semibold text-navy"
        }`}
      >
        {icon}
        {value}
      </span>
    </div>
  );
}
