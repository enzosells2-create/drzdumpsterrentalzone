import { DumpsterSizeOption } from "./types";

/**
 * ── EDIT DUMPSTER SIZES & PRICING HERE ──
 * Add, remove, or adjust sizes, prices, and the "perfect for" lists in
 * this single array. Everything else on the site (pricing cards,
 * contract, payment summary) reads from here.
 *
 * oneDayPrice and threeDayPrice are flat rates. weeklyPrice is the
 * rate for a full week — 2-week/3-week/1-month plans just multiply
 * weeklyPrice by 2, 3, and 4 (no volume discount). See
 * RENTAL_DURATION_OPTIONS and calculatePrice below.
 */
/** Tons of weight included in the base price, for every size. */
export const INCLUDED_TONS = 2;

export const DUMPSTER_SIZES: DumpsterSizeOption[] = [
  {
    id: "5-yard",
    label: "5 Yard",
    units: 1,
    oneDayPrice: 150,
    threeDayPrice: 200,
    weeklyPrice: 250,
    perfectFor: ["Small cleanups", "Remodeling", "Junk removal"],
    includes: [`${INCLUDED_TONS} ton capacity`, "Flexible rental terms", "Fast delivery"],
  },
  {
    id: "10-yard",
    label: "10 Yard",
    units: 1,
    oneDayPrice: 250,
    threeDayPrice: 300,
    weeklyPrice: 350,
    perfectFor: ["Medium jobs", "Garage cleanout", "Construction debris"],
    includes: [`${INCLUDED_TONS} ton capacity`, "Flexible rental terms", "Reliable service"],
  },
  {
    id: "12-yard",
    label: "12 Yard Roll-Off",
    units: 11,
    oneDayPrice: 275,
    threeDayPrice: 325,
    weeklyPrice: 375,
    perfectFor: ["Medium cleanups", "Roofing projects", "Small renovations"],
    includes: [`${INCLUDED_TONS} ton capacity`, "Flexible rental terms", "Reliable service"],
  },
  {
    id: "15-yard",
    label: "15 Yard",
    units: 2,
    oneDayPrice: 300,
    threeDayPrice: 350,
    weeklyPrice: 400,
    perfectFor: ["Large projects", "Home renovations", "Basement cleanup"],
    includes: [`${INCLUDED_TONS} ton capacity`, "Flexible rental terms", "Professional service"],
  },
  {
    id: "16-yard-trailer",
    label: "16 Yard Roll-Off Trailer",
    units: 6,
    oneDayPrice: 325,
    threeDayPrice: 375,
    weeklyPrice: 425,
    perfectFor: ["Equipment loading", "Landscaping projects", "Heavy-duty cleanups"],
    includes: [`${INCLUDED_TONS} ton capacity`, "Flexible rental terms", "Ramp access for wheeled equipment"],
  },
  {
    id: "20-yard",
    label: "20 Yard",
    units: 9,
    oneDayPrice: 350,
    threeDayPrice: 400,
    weeklyPrice: 450,
    perfectFor: ["Major renovations", "Commercial jobs", "Large cleanouts"],
    includes: [`${INCLUDED_TONS} ton capacity`, "Flexible rental terms", "Premium service"],
  },
  {
    id: "30-yard",
    label: "30 Yard",
    units: 1,
    oneDayPrice: 500,
    threeDayPrice: 550,
    weeklyPrice: 600,
    perfectFor: ["New construction", "Whole-building cleanouts", "Large commercial jobs"],
    includes: [`${INCLUDED_TONS} ton capacity`, "Flexible rental terms", "Priority service"],
  },
];

export const INCLUDED_FEATURES = [`${INCLUDED_TONS} tons of weight included`, "Fast delivery & pickup"];

/**
 * Rental duration plans offered on the booking form. `days` is a nominal
 * day count used for display and as the BookingData.rentalDays value;
 * `weeks` is how many times weeklyPrice is multiplied for that plan
 * (0 means the plan uses a flat rate instead — see calculatePrice).
 */
export const RENTAL_DURATION_OPTIONS = [
  { days: 1, weeks: 0, label: "1 Day" },
  { days: 3, weeks: 0, label: "3 Days" },
  { days: 7, weeks: 1, label: "1 Week" },
  { days: 14, weeks: 2, label: "2 Weeks" },
  { days: 21, weeks: 3, label: "3 Weeks" },
  { days: 30, weeks: 4, label: "1 Month" },
] as const;

export const TAX_RATE = 0.06;

export const OVERAGE_FEES = {
  extraTon: 75,
  overloaded: 75,
  extraDay: 35,
  tireEach: 25,
  fridgeEach: 100,
};

export function getDurationLabel(days: number): string {
  return RENTAL_DURATION_OPTIONS.find((o) => o.days === days)?.label ?? `${days} days`;
}

export function calculatePrice(size: DumpsterSizeOption, rentalDays: number): number {
  const plan = RENTAL_DURATION_OPTIONS.find((o) => o.days === rentalDays);
  if (!plan) return size.weeklyPrice;
  if (plan.days === 1) return size.oneDayPrice;
  if (plan.days === 3) return size.threeDayPrice;
  return size.weeklyPrice * plan.weeks;
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
  serviceArea: "Within 75 miles of South Lyon, Michigan",
};
