import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import AdminHeader from "@/components/AdminHeader";
import NewCommercialAccountForm from "./NewCommercialAccountForm";

export const metadata = {
  title: "New Commercial Account | DRZ Admin",
};

export default async function NewCommercialAccountPage() {
  const authed = await isAdminAuthed();
  if (!authed) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader icon="plus" subtitle="New Commercial Account" />
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl font-bold text-navy">Add a Commercial Account Manually</h1>
        <p className="mt-1 text-sm text-gray-500">
          For a business migrating over from somewhere else. They'll get an email with their account
          number so they can log in and place orders themselves at{" "}
          <span className="font-medium text-navy">/commercial/login</span>.
        </p>
        <div className="mt-6">
          <NewCommercialAccountForm />
        </div>
      </main>
    </div>
  );
}
