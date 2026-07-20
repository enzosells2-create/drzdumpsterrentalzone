import { Check, Trash2, Truck, Weight } from "lucide-react";
import { DUMPSTER_SIZES, INCLUDED_FEATURES } from "@/lib/pricing";
import { DumpsterSizeOption } from "@/lib/types";

export default function StepPricing({
  onSelect,
}: {
  onSelect: (size: DumpsterSizeOption) => void;
}) {
  return (
    <div>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-heading text-3xl font-extrabold text-navy sm:text-4xl">
          Roll-Off Dumpster Rentals, Delivered Fast
        </h1>
        <p className="mt-3 text-base text-gray-600 sm:text-lg">
          Pick the size that fits your project. Transparent pricing, no
          surprise fees, serving Livingston, Wayne, Oakland, and Macomb
          Counties.
        </p>
      </div>

      <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-navy">
        {INCLUDED_FEATURES.map((feature) => (
          <span key={feature} className="flex items-center gap-1.5">
            {feature.toLowerCase().includes("ton") ? (
              <Weight className="h-4 w-4 text-red" />
            ) : (
              <Truck className="h-4 w-4 text-red" />
            )}
            {feature} on every size
          </span>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {DUMPSTER_SIZES.map((size) => (
          <div
            key={size.id}
            className="card-hover flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
          >
            <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-navy to-navy-light">
              <Trash2 className="h-14 w-14 text-white/25" strokeWidth={1.5} />
              <span className="absolute font-heading text-4xl font-extrabold text-white">
                {size.label.split(" ")[0]}
                <span className="ml-1 text-lg font-semibold text-white/70">yd</span>
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-heading text-xl font-bold text-navy">{size.label}</h3>
              <p className="mt-0.5 text-xs text-gray-400">{size.dimensions}</p>
              <p className="mt-2 font-heading text-2xl font-extrabold text-red">
                ${size.priceMin}–${size.priceMax}
              </p>

              <ul className="mt-4 flex-1 space-y-1.5">
                {size.perfectFor.map((item) => (
                  <li key={item} className="flex items-start gap-1.5 text-sm text-gray-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red" />
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onSelect(size)}
                className="mt-5 w-full rounded-lg bg-red py-2.5 text-sm font-semibold text-white transition hover:bg-red-dark"
              >
                Select This Size
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
