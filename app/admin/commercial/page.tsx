import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import AdminCommercialTable from "./AdminCommercialTable";

export default async function AdminCommercialPage() {
  const authed = await isAdminAuthed();
  if (!authed) redirect("/admin/login");

  const accounts = await db.commercialAccount.findMany({
    orderBy: { createdAt: "desc" },
    include: { orders: { orderBy: { startDate: "desc" } } },
  });

  const serialized = accounts.map((a) => ({
    id: a.id,
    accountNumber: a.accountNumber,
    status: a.status,
    businessName: a.businessName,
    contactName: a.contactName,
    email: a.email,
    phone: a.phone,
    street: a.street,
    city: a.city,
    state: a.state,
    zip: a.zip,
    agreedAt: a.agreedAt.toISOString(),
    createdAt: a.createdAt.toISOString(),
    orders: a.orders.map((o) => ({
      id: o.id,
      confirmationNumber: o.confirmationNumber,
      sizeId: o.sizeId,
      startDate: o.startDate.toISOString(),
      endDate: o.endDate.toISOString(),
      rentalDays: o.rentalDays,
      price: o.price,
      status: o.status,
      street: o.street,
      city: o.city,
      state: o.state,
      zip: o.zip,
      outstandingBalance: o.outstandingBalance,
      outstandingNote: o.outstandingNote,
      createdAt: o.createdAt.toISOString(),
    })),
  }));

  return <AdminCommercialTable initialAccounts={serialized} />;
}
