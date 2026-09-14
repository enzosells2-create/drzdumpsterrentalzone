import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import AdminCommercialTable from "./AdminCommercialTable";

export default async function AdminCommercialPage() {
  const authed = await isAdminAuthed();
  if (!authed) redirect("/admin/login");

  const accounts = await db.commercialAccount.findMany({ orderBy: { startDate: "asc" } });

  const serialized = accounts.map((a) => ({
    id: a.id,
    confirmationNumber: a.confirmationNumber,
    sizeId: a.sizeId,
    startDate: a.startDate.toISOString(),
    endDate: a.endDate.toISOString(),
    termMonths: a.termMonths,
    monthlyRate: a.monthlyRate,
    status: a.status,
    businessName: a.businessName,
    contactName: a.contactName,
    email: a.email,
    phone: a.phone,
    street: a.street,
    city: a.city,
    state: a.state,
    zip: a.zip,
    createdAt: a.createdAt.toISOString(),
  }));

  return <AdminCommercialTable initialAccounts={serialized} />;
}
