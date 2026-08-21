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
import { generateConfirmationNumber, saveBooking } from "@/lib/storage";
import { calculatePrice } from "@/lib/pricing";

export default function BookingFlow() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<BookingData>(initialBookingData);
  const [confirmationNumber, setConfirmationNumber] = useState("");

  function update(patch: Partial<BookingData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function handleSelectSize(size: DumpsterSizeOption) {
    // Price starts as the base (3-day) rate; it's recalculated once the
    // customer picks a rental duration in the next step.
    update({ size, price: size.basePrice });
    setStep(2);
  }

  function handleLocationContinue(pin: { lat: number; lng: number }) {
    const confNum = generateConfirmationNumber();
    const finalData: BookingData = { ...data, pinLat: pin.lat, pinLng: pin.lng };

    setConfirmationNumber(confNum);
    update({ pinLat: pin.lat, pinLng: pin.lng });

    saveBooking({
      confirmationNumber: confNum,
      createdAt: new Date().toISOString(),
      status: "Pending",
      size: finalData.size?.label ?? "",
      price: finalData.price ?? 0,
      fullName: finalData.fullName,
      email: finalData.email,
      phone: finalData.phone,
      street: finalData.street,
      city: finalData.city,
      state: finalData.state,
      zip: finalData.zip,
      deliveryDate: finalData.deliveryDate,
      rentalDays: finalData.rentalDays ?? 0,
      cardLast4: finalData.cardLast4,
      cardBrand: finalData.cardBrand,
      pinLat: pin.lat,
      pinLng: pin.lng,
    });

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
                update({ ...patch, price });
                setStep(3);
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
