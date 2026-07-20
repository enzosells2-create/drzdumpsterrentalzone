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
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `DRZ-${rand}`;
}

export function saveBooking(booking: SavedBooking): void {
  if (typeof window === "undefined") return;

  const existing = window.localStorage.getItem(STORAGE_KEY);
  const bookings: SavedBooking[] = existing ? JSON.parse(existing) : [];
  bookings.push(booking);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}
