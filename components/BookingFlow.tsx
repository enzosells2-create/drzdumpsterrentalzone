"use client";

import { useState } from "react";
import Header from "./Header";
import StepIndicator from "./StepIndicator";
import StepPricing from "./steps/StepPricing";
import StepCustomerInfo from "./steps/StepCustomerInfo";
import StepContract from "./steps/StepContract";
import StepPayment from "./steps/StepPayment";
import StepLocation from "./steps/StepLocation";
import StepConfirmation from "./steps/StepConfirmation";
import { BookingData, DumpsterSizeOption, initialBookingData } from "@/lib/types";
import { calculatePrice } from "@/lib/pricing";

export default function BookingFlow() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<BookingData>(initialBookingData);
  const [confirmationNumber, setConfirmationNumber] = useState("");

  function update(patch: Partial<BookingData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function handleSelectSize(size: DumpsterSizeOption) {
    // Price starts as a preview (3-day rate); it's recalculated once the
    // customer picks a rental duration in the next step. Also clears any
    // prior successful payment — see the comment in Step 2's onContinue.
    update({
      size,
      price: size.threeDayPrice,
      stripePaymentIntentId: null,
      cardName: "",
      cardBrand: "",
      cardLast4: "",
    });
    setStep(2);
  }

  async function handleLocationContinue(pin: { lat: number; lng: number }) {
    if (!data.size) throw new Error("No dumpster size selected.");
    if (!data.stripePaymentIntentId) throw new Error("Payment was not completed.");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sizeId: data.size.id,
        deliveryDate: data.deliveryDate,
        rentalDays: data.rentalDays,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        pinLat: pin.lat,
        pinLng: pin.lng,
        stripePaymentIntentId: data.stripePaymentIntentId,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      // 409 means someone else booked the last unit while this customer was
      // filling out the form — surface the server's message and let them
      // retry from Location (or go back and pick a different date/size).
      throw new Error(result.error || "Something went wrong completing your booking.");
    }

    setConfirmationNumber(result.confirmationNumber);
    // The server re-validates the promo code itself and is authoritative on
    // the discount actually applied, so sync that back. `data.price` stays
    // the base (pre-discount) rate throughout the flow — the confirmation
    // page subtracts the discount from it for display, so overwriting it
    // here with the server's already-discounted figure would double-count.
    update({ pinLat: pin.lat, pinLng: pin.lng, discountAmount: result.discountAmount });
    setStep(6);
  }

  function resetFlow() {
    setData(initialBookingData);
    setConfirmationNumber("");
    setStep(1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {step <= 5 && <StepIndicator current={step} />}

        <div key={step} className="animate-step-in">
          {step === 1 && <StepPricing onSelect={handleSelectSize} />}

          {step === 2 && (
            <StepCustomerInfo
              data={data}
              onBack={() => setStep(1)}
              onContinue={(patch) => {
                const rentalDays = patch.rentalDays ?? data.rentalDays;
                const price = data.size && rentalDays ? calculatePrice(data.size, rentalDays) : data.price;
                // Reaching this step again after a successful payment means
                // the customer went back and re-confirmed their info — the
                // price may no longer match what was already charged, so
                // clear that payment rather than risk reusing a mismatched
                // (or double-charging a fresh) one. A harmless no-op if they
                // never got to Payment yet.
                update({
                  ...patch,
                  price,
                  stripePaymentIntentId: null,
                  cardName: "",
                  cardBrand: "",
                  cardLast4: "",
                });
                setStep(3);
              }}
              onChangeSize={(size) => {
                // Same as picking this size on Step 1 — price starts as a
                // preview and gets recalculated once duration is (re)confirmed.
                update({
                  size,
                  price: size.threeDayPrice,
                  stripePaymentIntentId: null,
                  cardName: "",
                  cardBrand: "",
                  cardLast4: "",
                });
              }}
            />
          )}

          {step === 3 && (
            <StepContract
              data={data}
              onBack={() => setStep(2)}
              onContinue={(patch) => {
                update(patch);
                setStep(4);
              }}
            />
          )}

          {step === 4 && (
            <StepPayment
              data={data}
              onBack={() => setStep(3)}
              onContinue={(patch) => {
                update(patch);
                setStep(5);
              }}
            />
          )}

          {step === 5 && (
            <StepLocation data={data} onBack={() => setStep(4)} onContinue={handleLocationContinue} />
          )}

          {step === 6 && (
            <StepConfirmation data={data} confirmationNumber={confirmationNumber} onReset={resetFlow} />
          )}
        </div>
      </main>
    </div>
  );
}
