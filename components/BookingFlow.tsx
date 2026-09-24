"use client";

import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
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
  const [bookingError, setBookingError] = useState("");

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

  // Location now comes before Payment — this just saves the pin and moves
  // on. It stays async (matching StepLocation's onContinue signature/its
  // submitting-state handling) even though there's no network call here.
  async function handleLocationContinue(pin: { lat: number; lng: number }) {
    update({ pinLat: pin.lat, pinLng: pin.lng });
    setStep(5);
  }

  // Payment is the last data-collecting step now, so the actual booking
  // only gets created once it succeeds. `patch` (fresh from Stripe
  // confirmation) hasn't landed in `data` yet at this point in the render
  // cycle — merge it in locally rather than reading `data.*` directly, same
  // pattern Step 2's onContinue already uses for its own patch.
  async function handlePaymentContinue(patch: Partial<BookingData>) {
    const merged = { ...data, ...patch };
    update(patch);
    setBookingError("");

    if (!merged.size || !merged.stripePaymentIntentId || merged.pinLat == null || merged.pinLng == null) {
      setBookingError("Something went wrong — please try again.");
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sizeId: merged.size.id,
          deliveryDate: merged.deliveryDate,
          rentalDays: merged.rentalDays,
          fullName: merged.fullName,
          email: merged.email,
          phone: merged.phone,
          street: merged.street,
          city: merged.city,
          state: merged.state,
          zip: merged.zip,
          pinLat: merged.pinLat,
          pinLng: merged.pinLng,
          stripePaymentIntentId: merged.stripePaymentIntentId,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        // 409 means someone else booked the last unit while this customer
        // was filling out the form. The payment already succeeded, so
        // StepPayment's "already paid" branch will re-render with a
        // Continue button — retrying calls this function again rather than
        // charging a second time.
        throw new Error(result.error || "Something went wrong completing your booking.");
      }

      setConfirmationNumber(result.confirmationNumber);
      // The server re-validates the promo code itself and is authoritative
      // on the discount actually applied, so sync that back. `data.price`
      // stays the base (pre-discount) rate throughout the flow — the
      // confirmation page subtracts the discount from it for display, so
      // overwriting it here with the server's already-discounted figure
      // would double-count.
      update({ discountAmount: result.discountAmount });
      setStep(6);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Something went wrong completing your booking.");
    }
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
            <StepLocation data={data} onBack={() => setStep(3)} onContinue={handleLocationContinue} />
          )}

          {step === 5 && (
            <>
              {bookingError && (
                <div className="mx-auto mb-4 max-w-3xl rounded-lg bg-red/10 px-3.5 py-2.5 text-sm font-medium text-red">
                  {bookingError}
                </div>
              )}
              <StepPayment data={data} onBack={() => setStep(4)} onContinue={handlePaymentContinue} />
            </>
          )}

          {step === 6 && (
            <StepConfirmation data={data} confirmationNumber={confirmationNumber} onReset={resetFlow} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
