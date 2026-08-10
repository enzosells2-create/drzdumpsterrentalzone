import { DumpsterSizeOption } from "./types";

/**
 * ── EDIT DUMPSTER SIZES & PRICING HERE ──
 * Add, remove, or adjust sizes, price ranges, dimensions, and the
 * "perfect for" lists in this single array. Everything else on the
 * site (pricing cards, contract, payment summary) reads from here.
 */
export const DUMPSTER_SIZES: DumpsterSizeOption[] = [
  {
    id: "2.5-yard",
    label: "2.5 Yard",
    priceMin: 149,
    priceMax: 200,
    dimensions: "8' L x 4' W x 3' H",
    imageUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&h=300&fit=crop",
    perfectFor: ["Small cleanups", "Remodeling", "Junk removal"],
    includes: ["2 ton capacity", "3-7 day rental", "Fast delivery"],
  },
  {
    id: "10-yard",
    label: "10 Yard",
    priceMin: 275,
    priceMax: 325,
    dimensions: "14' L x 8' W x 4' H",
    imageUrl: "https://images.unsplash.com/photo-1581092160562-40fed08d4e00?w=500&h=300&fit=crop",
    perfectFor: ["Medium jobs", "Garage cleanout", "Construction debris"],
    includes: ["2 ton capacity", "3-7 day rental", "Reliable service"],
  },
  {
    id: "15-yard",
    label: "15 Yard",
    priceMin: 350,
    priceMax: 400,
    dimensions: "16' L x 8' W x 4.5' H",
    imageUrl: "https://images.unsplash.com/photo-1578654377249-e339c74d1dca?w=500&h=300&fit=crop",
    perfectFor: ["Large projects", "Home renovations", "Basement cleanup"],
    includes: ["2 ton capacity", "3-7 day rental", "Professional service"],
  },
  {
    id: "20-yard",
    label: "20 Yard",
    priceMin: 400,
    priceMax: 450,
    dimensions: "18' L x 8' W x 5' H",
    imageUrl: "https://images.unsplash.com/photo-1581092335391-113b2089fad9?w=500&h=300&fit=crop",
    perfectFor: ["Major renovations", "Commercial jobs", "Large cleanouts"],
    includes: ["2 ton capacity", "3-7 day rental", "Premium service"],
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
  "Asbestos materials",
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
