import Header from "@/components/Header";
import CommercialLoginForm from "./CommercialLoginForm";

export const metadata = {
  title: "Commercial Account Login | DRZ Dumpster Rental",
  description: "Log in to your DRZ commercial account with your account number to view orders and place new ones.",
};

export default function CommercialLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-md px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-heading text-2xl font-bold text-navy sm:text-3xl">Commercial Account Login</h1>
        <p className="mt-2 text-gray-600">
          Enter your commercial account number to view your orders, balance, and place new ones.
        </p>
        <div className="mt-6">
          <CommercialLoginForm />
        </div>
      </main>
    </div>
  );
}
