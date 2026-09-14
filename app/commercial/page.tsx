import Header from "@/components/Header";
import CommercialForm from "./CommercialForm";

export const metadata = {
  title: "Commercial Accounts | DRZ Dumpster Rental",
  description:
    "Ongoing dumpster service for businesses — $50/month off, billed monthly on a Net 30 credit line, 3-month minimum term.",
};

export default function CommercialPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-heading text-2xl font-bold text-navy sm:text-3xl">Commercial Accounts</h1>
        <p className="mt-2 text-gray-600">
          Ongoing dumpster service for businesses and contractors. $50 off our standard monthly rate,
          billed monthly on a Net 30 credit line — no upfront card charge. Requires a signed commercial
          agreement and a minimum 3-month term.
        </p>
        <div className="mt-6">
          <CommercialForm />
        </div>
      </main>
    </div>
  );
}
