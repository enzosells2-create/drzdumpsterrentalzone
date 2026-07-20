import { CheckCircle2, MapPin, Phone } from "lucide-react";
import { BookingData } from "@/lib/types";
import { COMPANY } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";

type Props = {
  data: BookingData;
  confirmationNumber: string;
  onReset: () => void;
};

export default function StepConfirmation({ data, confirmationNumber, onReset }: Props) {
  const deliveryDateLabel = data.deliveryDate
    ? new Date(data.deliveryDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red/10">
        <CheckCircle2 className="h-9 w-9 text-red" />
      </div>
      <h2 className="mt-4 font-heading text-3xl font-extrabold text-navy">Booking Confirmed!</h2>
      <p className="mt-2 text-gray-600">
        Thanks, {data.fullName.split(" ")[0] || "there"}. Your dumpster is scheduled. We&apos;ll see
        you on delivery day.
      </p>

      <div className="mt-6 inline-block rounded-xl bg-navy px-6 py-3">
        <p className="text-xs uppercase tracking-wide text-white/60">Confirmation Number</p>
        <p className="font-heading text-2xl font-extrabold text-white">{confirmationNumber}</p>
      </div>

      <div className="mt-8 space-y-3 rounded-xl bg-white p-6 text-left shadow-sm ring-1 ring-gray-100">
        <SummaryRow label="Dumpster Size" value={data.size?.label ?? "—"} />
        <SummaryRow label="Price" value={data.price !== null ? formatCurrency(data.price) : "—"} />
        <SummaryRow label="Delivery Date" value={deliveryDateLabel} />
        <SummaryRow label="Rental Duration" value={data.rentalDays ? `${data.rentalDays} days` : "—"} />
        <SummaryRow
          label="Delivery Address"
          value={`${data.street}, ${data.city}, ${data.state} ${data.zip}`}
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
        <SummaryRow label="Card on File" value={data.cardLast4 ? `${data.cardBrand} •••• ${data.cardLast4}` : "—"} />
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl bg-gray-50 p-5 ring-1 ring-gray-100">
        <p className="text-sm text-gray-600">Questions about your order?</p>
        <a
          href={COMPANY.phoneHref}
          className="flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light"
        >
          <Phone className="h-4 w-4" /> {COMPANY.phone}
        </a>
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
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="flex items-center gap-1.5 text-sm font-semibold text-navy">
        {icon}
        {value}
      </span>
    </div>
  );
}
