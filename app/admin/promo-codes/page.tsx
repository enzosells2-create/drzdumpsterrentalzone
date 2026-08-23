import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import PromoCodesManager from "./PromoCodesManager";

export default async function PromoCodesPage() {
  const authed = await isAdminAuthed();
  if (!authed) redirect("/admin/login");

  const codes = await db.promoCode.findMany({ orderBy: { createdAt: "desc" } });

  const serialized = codes.map((c) => ({
    id: c.id,
    code: c.code,
    discountPercent: c.discountPercent,
    active: c.active,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    timesUsed: c.timesUsed,
    createdAt: c.createdAt.toISOString(),
  }));

  return <PromoCodesManager initialCodes={serialized} />;
}
