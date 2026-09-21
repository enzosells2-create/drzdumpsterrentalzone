"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, MapPin, Package, Phone } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import { DUMPSTER_SIZES } from "@/lib/pricing";

export type RentalMarker = {
  id: string;
  confirmationNumber: string;
  sizeId: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  pinLat: number | null;
  pinLng: number | null;
  unitNumber: number | null;
  startDate: string;
  endDate: string;
  status: string;
  commercial: boolean;
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

declare global {
  interface Window {
    google: any;
    __drzAdminMapCallback?: () => void;
  }
}

let mapsScriptPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps) return Promise.resolve();
  if (mapsScriptPromise) return mapsScriptPromise;

  mapsScriptPromise = new Promise((resolve, reject) => {
    window.__drzAdminMapCallback = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=__drzAdminMapCallback&v=weekly`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return mapsScriptPromise;
}

function sizeLabel(sizeId: string): string {
  return DUMPSTER_SIZES.find((s) => s.id === sizeId)?.label ?? sizeId;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
};

export default function AdminMapView({ markers }: { markers: RentalMarker[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "no-key" | "error">("loading");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setStatus("no-key");
      return;
    }
    if (!mapRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(async () => {
        if (cancelled || !mapRef.current) return;
        const google = window.google;
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 42.4534, lng: -83.6427 }, // South Lyon, MI
          zoom: 10,
          streetViewControl: false,
          mapTypeControl: false,
        });

        const geocoder = new google.maps.Geocoder();
        const bounds = new google.maps.LatLngBounds();
        let placed = 0;

        function placeMarker(m: RentalMarker, position: { lat: number; lng: number }) {
          const marker = new google.maps.Marker({
            position,
            map,
            title: `${sizeLabel(m.sizeId)}${m.unitNumber ? ` #${m.unitNumber}` : ""} — ${m.name}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: m.commercial ? "#0f2340" : "#e53935",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
          marker.addListener("click", () => setSelectedId(m.id));
          bounds.extend(position);
          placed += 1;
          if (placed === markers.length) map.fitBounds(bounds, 48);
        }

        for (const m of markers) {
          if (m.pinLat !== null && m.pinLng !== null) {
            placeMarker(m, { lat: m.pinLat, lng: m.pinLng });
            continue;
          }
          const address = `${m.street}, ${m.city}, ${m.state} ${m.zip}`;
          geocoder.geocode({ address }, (results: any, geoStatus: string) => {
            if (cancelled) return;
            if (geoStatus === "OK" && results?.[0]) {
              const loc = results[0].geometry.location;
              placeMarker(m, { lat: loc.lat(), lng: loc.lng() });
            } else {
              placed += 1;
              if (placed === markers.length && placed > 0) map.fitBounds(bounds, 48);
            }
          });
        }

        if (markers.length === 0) {
          setStatus("ready");
          return;
        }
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = markers.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader icon="map" subtitle="Dumpster Map" current="map" />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl font-bold text-navy">Where Every Dumpster Is</h1>
        <p className="mt-1 text-sm text-gray-500">
          {markers.length} active rental{markers.length === 1 ? "" : "s"} — residential in red, commercial
          in navy.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            {status === "no-key" && (
              <div className="flex h-[480px] flex-col items-center justify-center gap-2 px-6 text-center">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <p className="text-sm font-medium text-navy">No Google Maps API key configured.</p>
                <p className="text-xs text-gray-500">
                  Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to see the map — the list on the right still works.
                </p>
              </div>
            )}
            {status === "error" && (
              <div className="flex h-[480px] flex-col items-center justify-center gap-2 px-6 text-center">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <p className="text-sm font-medium text-navy">Google Maps failed to load.</p>
              </div>
            )}
            {status === "loading" && (
              <div className="flex h-[480px] items-center justify-center gap-2 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading map…
              </div>
            )}
            <div ref={mapRef} className={`h-[480px] w-full ${status === "ready" ? "block" : "hidden"}`} />

            {selected && status === "ready" && (
              <div className="border-t border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold text-navy">
                      <Package className="h-4 w-4 text-red" /> {sizeLabel(selected.sizeId)}
                      {selected.unitNumber && (
                        <span className="rounded-full bg-navy px-2 py-0.5 text-[11px] font-semibold text-white">
                          #{selected.unitNumber}
                        </span>
                      )}
                      {selected.commercial && (
                        <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[11px] font-semibold text-navy">
                          Commercial
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{selected.name}</p>
                    <p className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Phone className="h-3.5 w-3.5" /> {selected.phone}
                    </p>
                    <p className="flex items-start gap-1.5 text-sm text-gray-600">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {selected.street}, {selected.city}, {selected.state} {selected.zip}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(selected.startDate)} – {formatDate(selected.endDate)} · {selected.confirmationNumber}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS_STYLES[selected.status] ?? ""}`}
                  >
                    {selected.status}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="max-h-[480px] overflow-y-auto">
              {markers.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">No active rentals right now.</p>
              ) : (
                markers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`flex w-full items-start gap-2.5 border-t border-gray-100 px-4 py-3 text-left transition first:border-t-0 hover:bg-gray-50 ${
                      selectedId === m.id ? "bg-blue-50/60" : ""
                    }`}
                  >
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: m.commercial ? "#0f2340" : "#e53935" }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy">
                        {sizeLabel(m.sizeId)}
                        {m.unitNumber && <span className="ml-1 text-gray-400">#{m.unitNumber}</span>}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {m.street}, {m.city}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(m.startDate)} – {formatDate(m.endDate)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
