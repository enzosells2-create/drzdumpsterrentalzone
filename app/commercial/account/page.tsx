import { redirect } from "next/navigation";
import { getCommercialAccountId } from "@/lib/commercial-auth";
import { db } from "@/lib/db";
import CommercialAccountPortal from "./CommercialAccountPortal";

export const metadata = {
  title: "My Commercial Account | DRZ Dumpster Rental",
  description: "View your DRZ commercial account's orders, statuses, and balances.",
};

export default async function CommercialAccountPage() {
  const accountId = await getCommercialAccountId();
  if (!accountId) redirect("/commercial/login");

  const account = await db.commercialAccount.findUnique({
    where: { id: accountId },
    include: { orders: { orderBy: { startDate: "desc" } } },
  });
  if (!account) redirect("/commercial/login");

  const serialized = {
    accountNumber: account.accountNumber,
    status: account.status,
    businessName: account.businessName,
    contactName: account.contactName,
    email: account.email,
    phone: account.phone,
    street: account.street,
    city: account.city,
    state: account.state,
    zip: account.zip,
    createdAt: account.createdAt.toISOString(),
    orders: account.orders.map((o) => ({
      id: o.id,
      confirmationNumber: o.confirmationNumber,
      sizeId: o.sizeId,
      startDate: o.startDate.toISOString(),
      endDate: o.endDate.toISOString(),
      price: o.price,
      status: o.status,
      street: o.street,
      city: o.city,
      state: o.state,
      zip: o.zip,
      outstandingBalance: o.outstandingBalance,
      outstandingNote: o.outstandingNote,
    })),
  };

  return <CommercialAccountPortal account={serialized} />;
}
