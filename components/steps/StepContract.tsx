"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { BookingData } from "@/lib/types";
import { COMPANY, OVERAGE_FEES, PROHIBITED_ITEMS } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";

type Props = {
  data: BookingData;
  onBack: () => void;
  onContinue: (patch: Partial<BookingData>) => void;
};

export default function StepContract({ data, onBack, onContinue }: Props) {
  const [signature, setSignature] = useState(data.signature);
  const [agreedTerms, setAgreedTerms] = useState(data.agreedTerms);
  const [agreedAccuracy, setAgreedAccuracy] = useState(data.agreedAccuracy);
  const [touched, setTouched] = useState(false);

  const canContinue = signature.trim().length > 1 && agreedTerms && agreedAccuracy;

  function handleContinue() {
    setTouched(true);
    if (!canContinue) return;
    onContinue({ signature: signature.trim(), agreedTerms, agreedAccuracy });
  }

  const deliveryDateLabel = data.deliveryDate
    ? new Date(data.deliveryDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="font-heading text-2xl font-bold text-navy sm:text-3xl">Rental Agreement</h2>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:grid-cols-4">
        <SummaryItem label="Size" value={data.size?.label ?? "—"} />
        <SummaryItem label="Price" value={data.price !== null ? formatCurrency(data.price) : "—"} />
        <SummaryItem label="Delivery" value={deliveryDateLabel} />
        <SummaryItem label="Duration" value={data.rentalDays ? `${data.rentalDays} days` : "—"} />
      </div>

      <div className="mt-6 space-y-5 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
          <FileText className="h-5 w-5 text-red" />
          <p className="text-sm text-gray-500">
            Agreement between {COMPANY.name} and{" "}
            <strong className="text-navy">{data.fullName || "the customer"}</strong> for the
            delivery of a <strong className="text-navy">{data.size?.label ?? ""}</strong> dumpster
            to <strong className="text-navy">{data.street}, {data.city}, {data.state} {data.zip}</strong>.
          </p>
        </div>

        <Section title="What's Included">
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
            <li>2 tons (4,000 lbs) of weight included in the base price</li>
            <li>Delivery to and pickup from the address provided</li>
            <li>{data.rentalDays ?? "—"}-day rental period starting on the delivery date</li>
          </ul>
        </Section>

        <Section title="Prohibited Items">
          <p className="mb-2 text-sm text-gray-600">
            The following items may <strong>not</strong> be placed in the dumpster under any
            circumstances:
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
            {PROHIBITED_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <span className="text-red">✕</span> {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Weight & Overage Fees">
          <ul className="space-y-1 text-sm text-gray-600">
            <li>Additional ton over the included 2 tons: <strong className="text-navy">{formatCurrency(OVERAGE_FEES.extraTon)}</strong> per ton</li>
            <li>Overloaded dumpster (above fill line): <strong className="text-navy">{formatCurrency(OVERAGE_FEES.overloaded)}</strong></li>
            <li>Each additional day beyond the rental period: <strong className="text-navy">{formatCurrency(OVERAGE_FEES.extraDay)}</strong> per day</li>
            <li>Tires: <strong className="text-navy">{formatCurrency(OVERAGE_FEES.tireEach)}</strong> each</li>
            <li>Refrigerators/appliances with refrigerant: <strong className="text-navy">{formatCurrency(OVERAGE_FEES.fridgeEach)}</strong> each</li>
          </ul>
        </Section>

        <Section title="Liability & Care of the Dumpster">
          <p className="text-sm text-gray-600">
            The customer is responsible for the dumpster while it is on their property, including
            protecting it from damage, vandalism, or unauthorized use by third parties. The
            customer agrees to place the dumpster only in the location marked in the next step and
            to keep it accessible for pickup. {COMPANY.name} is not responsible for damage to
            driveways, lawns, or landscaping caused by normal delivery and pickup operations.
          </p>
        </Section>

        <Section title="Cancellation Policy">
          <p className="text-sm text-gray-600">
            Cancellations made more than 24 hours before the scheduled delivery date receive a
            full refund. Cancellations made within 24 hours of delivery, or after the dumpster has
            been delivered, are non-refundable.
          </p>
        </Section>
      </div>

      <div className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            Homeowner Signature
          </label>
          <input
            className="signature-line"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Type your full name to sign"
          />
          {touched && signature.trim().length <= 1 && (
            <p className="mt-1 text-xs font-medium text-red">A signature is required.</p>
          )}
        </div>

        <label className="flex items-start gap-2.5 text-sm text-gray-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-red"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
          />
          I have read and agree to the terms of this rental agreement, including the prohibited
          items list and overage fees.
        </label>
        {touched && !agreedTerms && (
          <p className="-mt-2 text-xs font-medium text-red">You must agree to the terms to continue.</p>
        )}

        <label className="flex items-start gap-2.5 text-sm text-gray-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-red"
            checked={agreedAccuracy}
            onChange={(e) => setAgreedAccuracy(e.target.checked)}
          />
          I confirm that the information I provided is accurate.
        </label>
        {touched && !agreedAccuracy && (
          <p className="-mt-2 text-xs font-medium text-red">Please confirm your information is accurate.</p>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={handleContinue}
          className="flex items-center gap-1.5 rounded-lg bg-red px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-dark"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 font-heading text-sm font-bold uppercase tracking-wide text-navy">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="truncate text-sm font-semibold text-navy">{value}</p>
    </div>
  );
}
