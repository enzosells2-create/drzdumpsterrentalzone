import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { DUMPING_FEE_PER_ORDER, GAS_FEE_PER_ORDER } from "@/lib/finances";
import FinancesDashboard from "./FinancesDashboard";

export const metadata = {
  title: "Finances | DRZ Admin",
};

export default async function FinancesPage() {
  const authed = await isAdminAuthed();
  if (!authed) redirect("/admin/login");

  // Every non-cancelled order counts toward revenue and automatically
  // carries the flat dumping + gas cost — cancelled orders never happened,
  // so they carry neither.
  const [bookings, orders] = await Promise.all([
    db.booking.findMany({
      where: { status: { not: "Cancelled" } },
      select: { price: true, outstandingBalance: true, status: true },
    }),
    db.commercialOrder.findMany({
      where: { status: { not: "Cancelled" } },
      select: { price: true, outstandingBalance: true, status: true },
    }),
  ]);

  const residentialCount = bookings.length;
  const commercialCount = orders.length;
  const orderCount = residentialCount + commercialCount;

  const revenue = [...bookings, ...orders].reduce((sum, o) => sum + o.price, 0);
  const outstanding = [...bookings, ...orders].reduce((sum, o) => sum + o.outstandingBalance, 0);

  const dumpingTotal = orderCount * DUMPING_FEE_PER_ORDER;
  const gasTotal = orderCount * GAS_FEE_PER_ORDER;
  const expenseTotal = dumpingTotal + gasTotal;
  const profit = revenue - expenseTotal;

  return (
    <FinancesDashboard
      orderCount={orderCount}
      residentialCount={residentialCount}
      commercialCount={commercialCount}
      revenue={revenue}
      outstanding={outstanding}
      dumpingTotal={dumpingTotal}
      gasTotal={gasTotal}
      expenseTotal={expenseTotal}
      profit={profit}
    />
  );
}
