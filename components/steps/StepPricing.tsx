import { Check } from "lucide-react";
import { DUMPSTER_SIZES } from "@/lib/pricing";
import { DumpsterSizeOption } from "@/lib/types";

export default function StepPricing({
  onSelect,
}: {
  onSelect: (size: DumpsterSizeOption) => void;
}) {
  return (
    <div>
      <div
        className="relative overflow-hidden rounded-2xl bg-cover bg-center px-6 py-16 text-center text-white sm:py-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,35,64,0.72), rgba(15,35,64,0.72)), url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=400&fit=crop')",
        }}
      >
        <h1 className="font-heading text-3xl font-extrabold drop-shadow sm:text-5xl">
          Choose Your Perfect Dumpster Size
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-white/90 sm:text-lg">
          Professional waste management solutions for Michigan
        </p>
        <p className="mt-2 text-sm text-white/70">
          Select a dumpster size and let&apos;s get started with your rental
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {DUMPSTER_SIZES.map((size) => (
          <button
            key={size.id}
            onClick={() => onSelect(size)}
            className="card-hover flex flex-col overflow-hidden rounded-2xl border-2 border-transparent bg-white text-left shadow-sm ring-1 ring-gray-100 hover:border-red"
          >
            <div className="relative h-48 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={size.imageUrl}
                alt={`${size.label} dumpster`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red to-red-dark" />
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-heading text-xl font-bold text-navy">{size.label}</h3>
              <p className="mt-0.5 text-xs text-gray-400">{size.dimensions}</p>
              <p className="mt-2 font-heading text-2xl font-extrabold text-red">
                ${size.priceMin} – ${size.priceMax}
              </p>

              <div className="mt-4 flex-1 space-y-3 border-b border-gray-100 pb-4 text-sm text-gray-600">
                <div>
                  <p className="mb-1 font-semibold text-navy">Perfect for:</p>
                  <ul className="space-y-1">
                    {size.perfectFor.map((item) => (
                      <li key={item} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-semibold text-navy">Includes:</p>
                  <ul className="space-y-1">
                    {size.includes.map((item) => (
                      <li key={item} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <span className="mt-5 block w-full rounded-lg bg-red py-2.5 text-center text-sm font-semibold text-white transition hover:bg-red-dark">
                Select This Size
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
