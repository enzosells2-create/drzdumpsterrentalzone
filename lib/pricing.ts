import { DumpsterSizeOption } from "./types";

/**
 * ── EDIT DUMPSTER SIZES & PRICING HERE ──
 * Add, remove, or adjust sizes, prices, and the "perfect for" lists in
 * this single array. Everything else on the site (pricing cards,
 * contract, payment summary) reads from here.
 *
 * basePrice is the flat rate for a BASE_RENTAL_DAYS-day rental (see
 * below). Renting longer adds OVERAGE_FEES.extraDay per extra day.
 * oneDayPrice is stored for reference if you want to add a cheaper
 * 1-day option to the booking form later — it isn't used yet.
 */
export const DUMPSTER_SIZES: DumpsterSizeOption[] = [
  {
    id: "5-yard",
    label: "5 Yard",
    basePrice: 250,
    oneDayPrice: 200,
    perfectFor: ["Small cleanups", "Remodeling", "Junk removal"],
    includes: ["2 ton capacity", "3-7 day rental", "Fast delivery"],
  },
  {
    id: "10-yard",
    label: "10 Yard",
    basePrice: 350,
    oneDayPrice: 300,
    perfectFor: ["Medium jobs", "Garage cleanout", "Construction debris"],
    includes: ["2 ton capacity", "3-7 day rental", "Reliable service"],
  },
  {
    id: "15-yard",
    label: "15 Yard",
    basePrice: 400,
    oneDayPrice: 350,
    perfectFor: ["Large projects", "Home renovations", "Basement cleanup"],
    includes: ["2 ton capacity", "3-7 day rental", "Professional service"],
  },
  {
    id: "20-yard",
    label: "20 Yard",
    basePrice: 450,
    oneDayPrice: 400,
    perfectFor: ["Major renovations", "Commercial jobs", "Large cleanouts"],
    includes: ["2 ton capacity", "3-7 day rental", "Premium service"],
  },
  {
    id: "30-yard",
    label: "30 Yard",
    basePrice: 600,
    oneDayPrice: 550,
    perfectFor: ["New construction", "Whole-building cleanouts", "Large commercial jobs"],
    includes: ["2 ton capacity", "3-7 day rental", "Priority service"],
  },
];

export const INCLUDED_FEATURES = ["2 tons of weight included", "Fast delivery & pickup"];

export const RENTAL_DURATION_OPTIONS = [3, 5, 7, 10, 14] as const;

/** Number of rental days included in each size's basePrice. */
export const BASE_RENTAL_DAYS = 3;

export const TAX_RATE = 0.06;

export const OVERAGE_FEES = {
  extraTon: 75,
  overloaded: 75,
  extraDay: 35,
  tireEach: 25,
  fridgeEach: 100,
};

export function calculatePrice(size: DumpsterSizeOption, rentalDays: number): number {
  const extraDays = Math.max(0, rentalDays - BASE_RENTAL_DAYS);
  return size.basePrice + extraDays * OVERAGE_FEES.extraDay;
}

export const PROHIBITED_ITEMS = [
  "Tires",
  "Appliances & refrigerators",
  "Hazardous materials",
  "Paint & liquids",
  "Batteries",
  "Asbestos materials",
];

export const COMPANY = {
  name: "DRZ Dumpster Rental",
  phone: "(734) 366-4865",
  phoneHref: "tel:+17343664865",
  serviceArea: "Livingston, Wayne, Oakland, and Macomb Counties, Michigan",
};
