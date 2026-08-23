export type DumpsterSizeOption = {
  id: string;
  label: string;
  /** How many physical units of this size the business owns. Caps concurrent bookings. */
  units: number;
  /** Flat rate for a 1-day rental. */
  oneDayPrice: number;
  /** Flat rate for a 3-day rental. */
  threeDayPrice: number;
  /** Rate for a full week; 2/3-week and 1-month plans are multiples of this. */
  weeklyPrice: number;
  perfectFor: string[];
  includes: string[];
};

/** Nominal day counts for the rental duration plans (see RENTAL_DURATION_OPTIONS). */
export type RentalDuration = 1 | 3 | 7 | 14 | 21 | 30;

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

  promoCode: string | null;
  discountPercent: number | null;
  discountAmount: number | null;

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

  promoCode: null,
  discountPercent: null,
  discountAmount: null,

  pinLat: null,
  pinLng: null,
};
