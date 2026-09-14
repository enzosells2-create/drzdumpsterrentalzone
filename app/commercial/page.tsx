import Header from "@/components/Header";
import CommercialForm from "./CommercialForm";

export const metadata = {
  title: "Commercial Accounts | DRZ Dumpster Rental",
  description:
    "Ongoing dumpster service for businesses — $50 off every order, billed on a Net 30 credit line. Minimum 3 orders per month.",
};

export default function CommercialPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-heading text-2xl font-bold text-navy sm:text-3xl">Commercial Accounts</h1>
        <p className="mt-2 text-gray-600">
          Ongoing dumpster service for businesses and contractors. $50 off our standard rate on every
          order, billed on a Net 30 credit line — no upfront card charge. Requires a signed commercial
          agreement and a minimum of 3 orders per month.
        </p>
        <div className="mt-6">
          <CommercialForm />
        </div>
      </main>
    </div>
  );
}
