import { Suspense } from "react";
import Header from "@/components/Header";
import CommercialOrderForm from "./CommercialOrderForm";

export const metadata = {
  title: "Place a Commercial Order | DRZ Dumpster Rental",
  description: "Place a dumpster order under your existing DRZ commercial account.",
};

export default function CommercialOrderPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-heading text-2xl font-bold text-navy sm:text-3xl">Place a Commercial Order</h1>
        <p className="mt-2 text-gray-600">
          For businesses with an existing commercial account. Enter your account number to order at
          your discounted rate — you'll be invoiced, no card needed.
        </p>
        <div className="mt-6">
          <Suspense fallback={null}>
            <CommercialOrderForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
