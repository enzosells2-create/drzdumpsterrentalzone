"use client";

import { useState } from "react";
import { AlertTriangle, Fuel, Trash2, TrendingUp } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import { DUMPING_FEE_PER_ORDER, GAS_FEE_PER_ORDER } from "@/lib/finances";
import { formatCurrency } from "@/lib/format";

type Slice = { label: string; value: number; color: string; icon: React.ReactNode };

type Props = {
  orderCount: number;
  residentialCount: number;
  commercialCount: number;
  revenue: number;
  outstanding: number;
  dumpingTotal: number;
  gasTotal: number;
  expenseTotal: number;
  profit: number;
};

export default function FinancesDashboard({
  orderCount,
  residentialCount,
  commercialCount,
  revenue,
  outstanding,
  dumpingTotal,
  gasTotal,
  expenseTotal,
  profit,
}: Props) {
  const isProfitable = profit >= 0;

  const slices: Slice[] = isProfitable
    ? [
        { label: "Net Profit", value: profit, color: "#16a34a", icon: <TrendingUp className="h-3.5 w-3.5" /> },
        { label: "Dumping Fees", value: dumpingTotal, color: "#0f2340", icon: <Trash2 className="h-3.5 w-3.5" /> },
        { label: "Gas", value: gasTotal, color: "#e53935", icon: <Fuel className="h-3.5 w-3.5" /> },
      ]
    : [
        { label: "Dumping Fees", value: dumpingTotal, color: "#0f2340", icon: <Trash2 className="h-3.5 w-3.5" /> },
        { label: "Gas", value: gasTotal, color: "#e53935", icon: <Fuel className="h-3.5 w-3.5" /> },
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader icon="dollar" subtitle="Finances" current="finances" />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl font-bold text-navy">Profit &amp; Expenses</h1>
        <p className="mt-1 text-sm text-gray-500">
          Every non-cancelled order automatically carries {formatCurrency(DUMPING_FEE_PER_ORDER)} for
          dumping and {formatCurrency(GAS_FEE_PER_ORDER)} for gas — no manual entry needed.
        </p>

        {!isProfitable && (
          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-red/20 bg-red/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red" />
            <p className="text-sm text-red">
              Expenses ({formatCurrency(expenseTotal)}) are currently more than revenue (
              {formatCurrency(revenue)}) — running at a loss of {formatCurrency(Math.abs(profit))}.
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Revenue" value={formatCurrency(revenue)} />
          <StatCard label="Expenses" value={formatCurrency(expenseTotal)} valueClassName="text-navy" />
          <StatCard
            label="Net Profit"
            value={formatCurrency(profit)}
            valueClassName={isProfitable ? "text-green-600" : "text-red"}
          />
          <StatCard label="Orders Counted" value={String(orderCount)} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
          <div className="flex justify-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <DonutChart slices={slices} total={isProfitable ? revenue : expenseTotal} />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-navy">Breakdown</h2>
            <div className="mt-4 space-y-3">
              {slices.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-navy">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.icon}
                    </span>
                    {s.label}
                  </span>
                  <span className="text-sm font-semibold text-navy">
                    {formatCurrency(s.value)}
                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                      ({Math.round((s.value / (isProfitable ? revenue || 1 : expenseTotal || 1)) * 100)}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-1.5 border-t border-gray-100 pt-4 text-xs text-gray-500">
              <p>
                {residentialCount} residential + {commercialCount} commercial order
                {orderCount === 1 ? "" : "s"} counted (cancelled orders excluded).
              </p>
              <p>
                {formatCurrency(DUMPING_FEE_PER_ORDER)} × {orderCount} = {formatCurrency(dumpingTotal)} dumping,{" "}
                {formatCurrency(GAS_FEE_PER_ORDER)} × {orderCount} = {formatCurrency(gasTotal)} gas.
              </p>
              {outstanding > 0 && (
                <p className="text-amber-600">
                  Separately, {formatCurrency(outstanding)} in outstanding balances is owed but not yet
                  counted as collected revenue above.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClassName = "text-navy",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 font-heading text-lg font-extrabold sm:text-xl ${valueClassName}`}>{value}</p>
    </div>
  );
}

function DonutChart({ slices, total }: { slices: Slice[]; total: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const size = 220;
  const strokeWidth = 34;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = total || 1;

  let cumulativeFraction = 0;
  const segments = slices.map((s) => {
    const fraction = s.value / safeTotal;
    const dash = fraction * circumference;
    const offset = -cumulativeFraction * circumference;
    cumulativeFraction += fraction;
    return { ...s, dash, offset };
  });

  const activeSlice = hovered !== null ? slices[hovered] : null;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef1f6" strokeWidth={strokeWidth} />
          {segments.map((seg, i) => (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hovered === i ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={seg.offset}
              className="transition-all"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-heading text-xl font-extrabold text-navy">
          {formatCurrency(activeSlice ? activeSlice.value : total)}
        </p>
        <p className="text-xs text-gray-400">{activeSlice ? activeSlice.label : "Total"}</p>
      </div>
    </div>
  );
}
