const STORAGE_KEY = "drzBookings";

export type SavedBooking = {
  confirmationNumber: string;
  createdAt: string;
  status: "Pending";

  size: string;
  price: number;

  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  deliveryDate: string;
  rentalDays: number;

  cardLast4: string;
  cardBrand: string;

  pinLat: number | null;
  pinLng: number | null;
};

export function generateConfirmationNumber(): string {
  return `DRZ${Date.now().toString().slice(-8)}`;
}

export function saveBooking(booking: SavedBooking): void {
  if (typeof window === "undefined") return;

  const existing = window.localStorage.getItem(STORAGE_KEY);
  const bookings: SavedBooking[] = existing ? JSON.parse(existing) : [];
  bookings.push(booking);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}
