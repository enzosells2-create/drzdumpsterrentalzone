export type DumpsterSizeOption = {
  id: string;
  label: string;
  /** Flat rate for the base rental period (see BASE_RENTAL_DAYS in lib/pricing.ts). */
  basePrice: number;
  /** Optional cheaper rate for a 1-day rental, if you want to offer that option later. */
  oneDayPrice?: number;
  perfectFor: string[];
  includes: string[];
};

export type RentalDuration = 3 | 5 | 7 | 10 | 14;

export type BookingData = {
  size: DumpsterSizeOption | null;
  price: number | null;

  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  deliveryDate: string;
  rentalDays: RentalDuration | null;

  signature: string;
  agreedTerms: boolean;
  agreedAccuracy: boolean;

  cardName: string;
  cardLast4: string;
  cardBrand: string;

  pinLat: number | null;
  pinLng: number | null;
};

export const initialBookingData: BookingData = {
  size: null,
  price: null,

  fullName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "MI",
  zip: "",
  deliveryDate: "",
  rentalDays: null,

  signature: "",
  agreedTerms: false,
  agreedAccuracy: false,

  cardName: "",
  cardLast4: "",
  cardBrand: "",

  pinLat: null,
  pinLng: null,
};
