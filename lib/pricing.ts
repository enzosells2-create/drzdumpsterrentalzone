import { DumpsterSizeOption } from "./types";

/**
 * ── EDIT DUMPSTER SIZES & PRICING HERE ──
 * Add, remove, or adjust sizes, price ranges, dimensions, and the
 * "perfect for" lists in this single array. Everything else on the
 * site (pricing cards, contract, payment summary) reads from here.
 */
export const DUMPSTER_SIZES: DumpsterSizeOption[] = [
  {
    id: "5-yard",
    label: "5 Yard",
    priceMin: 149,
    priceMax: 200,
    dimensions: "12' L x 8' W x 3.5' H",
    perfectFor: [
      "Small cleanouts",
      "Bathroom remodels",
      "Yard debris",
      "Garage cleanup",
    ],
  },
  {
    id: "10-yard",
    label: "10 Yard",
    priceMin: 275,
    priceMax: 325,
    dimensions: "14' L x 8' W x 4' H",
    perfectFor: [
      "Kitchen remodels",
      "Basement cleanouts",
      "Small roofing jobs",
      "Moving cleanouts",
    ],
  },
  {
    id: "15-yard",
    label: "15 Yard",
    priceMin: 350,
    priceMax: 400,
    dimensions: "16' L x 8' W x 4.5' H",
    perfectFor: [
      "Whole-home cleanouts",
      "Large renovations",
      "Deck removal",
      "Multi-room projects",
    ],
  },
  {
    id: "20-yard",
    label: "20 Yard",
    priceMin: 400,
    priceMax: 450,
    dimensions: "18' L x 8' W x 5' H",
    perfectFor: [
      "New construction",
      "Major renovations",
      "Commercial cleanouts",
      "Large roofing jobs",
    ],
  },
];

export const INCLUDED_FEATURES = ["2 tons of weight included", "Fast delivery & pickup"];

export const RENTAL_DURATION_OPTIONS = [3, 5, 7, 10, 14] as const;

export const TAX_RATE = 0.06;

export const OVERAGE_FEES = {
  extraTon: 75,
  overloaded: 75,
  extraDay: 20,
  tireEach: 25,
  fridgeEach: 100,
};

export const PROHIBITED_ITEMS = [
  "Tires",
  "Appliances & refrigerators",
  "Hazardous materials",
  "Paint & liquids",
  "Batteries",
];

export const COMPANY = {
  name: "DRZ Dumpster Rental",
  phone: "(734) 366-4865",
  phoneHref: "tel:+17343664865",
  serviceArea: "Livingston, Wayne, Oakland, and Macomb Counties, Michigan",
};

export function midpointPrice(size: DumpsterSizeOption): number {
  return Math.round((size.priceMin + size.priceMax) / 2);
}
