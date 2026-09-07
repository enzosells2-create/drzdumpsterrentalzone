import { Suspense } from "react";
import Header from "@/components/Header";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact Us | DRZ Dumpster Rental",
  description: "Have a question about your order or a dumpster rental? Send us a message.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-heading text-2xl font-bold text-navy sm:text-3xl">Contact Us</h1>
        <p className="mt-2 text-gray-600">
          Have a question about an order, or want to check on your rental? Send us a message and
          we'll get back to you.
        </p>
        <div className="mt-6">
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
