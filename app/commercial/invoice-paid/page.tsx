import { CheckCircle2, XCircle } from "lucide-react";
import Header from "@/components/Header";
import { stripe } from "@/lib/stripe-server";
import { formatCurrency } from "@/lib/format";

export const metadata = {
  title: "Invoice Paid | DRZ Dumpster Rental",
};

export default async function InvoicePaidPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let paid = false;
  let amount: number | null = null;
  let businessName: string | null = null;

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      paid = session.payment_status === "paid";
      amount = session.amount_total ? session.amount_total / 100 : null;
      businessName = (session.metadata?.businessName as string) ?? null;
    } catch {
      paid = false;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        {paid ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="mt-4 font-heading text-2xl font-bold text-navy">Payment Received</h1>
            <p className="mt-2 text-gray-600">
              Thanks{businessName ? `, ${businessName}` : ""}! We've received your payment
              {amount !== null ? ` of ${formatCurrency(amount)}` : ""}.
            </p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red" />
            <h1 className="mt-4 font-heading text-2xl font-bold text-navy">Payment Not Completed</h1>
            <p className="mt-2 text-gray-600">
              We couldn't confirm this payment. If you were charged, contact us and we'll sort it out.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
