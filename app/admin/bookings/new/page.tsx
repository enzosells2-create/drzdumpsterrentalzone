import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import AdminHeader from "@/components/AdminHeader";
import NewBookingForm from "./NewBookingForm";

export const metadata = {
  title: "New Booking | DRZ Admin",
};

export default async function NewBookingPage() {
  const authed = await isAdminAuthed();
  if (!authed) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader icon="plus" subtitle="New Booking" />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl font-bold text-navy">Add a Booking Manually</h1>
        <p className="mt-1 text-sm text-gray-500">
          For a customer migrating over from somewhere else, or an order taken by phone. No payment
          is collected here — enter the price you agreed on.
        </p>
        <div className="mt-6">
          <NewBookingForm />
        </div>
      </main>
    </div>
  );
}
