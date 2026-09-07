import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import AdminMessages from "./AdminMessages";

export default async function AdminMessagesPage() {
  const authed = await isAdminAuthed();
  if (!authed) redirect("/admin/login");

  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  const serialized = messages.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    confirmationNumber: m.confirmationNumber,
    message: m.message,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
  }));

  return <AdminMessages initialMessages={serialized} />;
}
