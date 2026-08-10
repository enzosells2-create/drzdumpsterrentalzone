"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, MapPin } from "lucide-react";
import { BookingData } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

// ────────────────────────────────────────────────────────────────────
// GOOGLE MAPS API KEY SPOT
// Paste your Google Maps JavaScript API key below. In the Google Cloud
// Console, enable both the "Maps JavaScript API" and "Geocoding API"
// for this key: https://console.cloud.google.com/google/maps-apis
// You can also set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local instead
// of editing this file directly.
// ────────────────────────────────────────────────────────────────────
const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE";

declare global {
  interface Window {
    google: any;
    __drzGoogleMapsCallback?: () => void;
  }
}

let mapsScriptPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps) return Promise.resolve();
  if (mapsScriptPromise) return mapsScriptPromise;

  mapsScriptPromise = new Promise((resolve, reject) => {
    window.__drzGoogleMapsCallback = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=__drzGoogleMapsCallback&v=weekly`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return mapsScriptPromise;
}

type Status = "loading" | "ready" | "no-key" | "geocode-error" | "script-error";
type Pin = { lat: number; lng: number };

type Props = {
  data: BookingData;
  onBack: () => void;
  onContinue: (pin: Pin) => void;
};

export default function StepLocation({ data, onBack, onContinue }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [pin, setPin] = useState<Pin | null>(null);

  const fullAddress = `${data.street}, ${data.city}, ${data.state} ${data.zip}`;

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.startsWith("PASTE_YOUR_")) {
      setStatus("no-key");
      return;
    }

    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: fullAddress }, (results: any, geoStatus: string) => {
          if (cancelled) return;
          if (geoStatus !== "OK" || !results?.[0]) {
            setStatus("geocode-error");
            return;
          }

          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat, lng },
            zoom: 20,
            mapTypeId: "satellite",
            tilt: 0,
            streetViewControl: false,
            fullscreenControl: false,
            mapTypeControl: false,
          });

          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map,
            draggable: true,
            title: "Dumpster drop location",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#E53935",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });

          marker.addListener("dragend", () => {
            const pos = marker.getPosition();
            setPin({ lat: pos.lat(), lng: pos.lng() });
          });

          map.addListener("click", (e: any) => {
            marker.setPosition(e.latLng);
            setPin({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          });

          setPin({ lat, lng });
          setStatus("ready");
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("script-error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="bg-gradient-to-br from-navy to-navy-light px-6 py-8 text-center text-white">
        <h2 className="font-heading text-2xl font-bold sm:text-3xl">Pinpoint Dumpster Location</h2>
        <p className="mt-1 text-sm text-white/80">
          Click on the map to mark exactly where you want the dumpster placed
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        <div>
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-800">
            📍 <strong>Click anywhere on the satellite map</strong> to place a red marker showing
            exactly where you want the dumpster dropped on your driveway. You can drag the marker
            to adjust its position.
          </div>

          {status === "loading" && (
            <div className="flex h-[420px] w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Loading satellite map…</p>
              </div>
            </div>
          )}

          {(status === "no-key" || status === "geocode-error" || status === "script-error") && (
            <ManualPinFallback status={status} pin={pin} onSetPin={setPin} />
          )}

          <div
            ref={mapRef}
            className={`h-[420px] w-full rounded-lg border border-gray-200 ${
              status === "ready" ? "block" : "hidden"
            }`}
          />
        </div>

        <div className="flex flex-col justify-between">
          <div className="space-y-3">
            <InfoBox title="Delivery Address" value={fullAddress} />
            <InfoBox title="Selected Dumpster" value={data.size?.label ?? "—"} />
            <InfoBox
              title="Pinned Location"
              value={
                pin ? (
                  <span className="flex items-center gap-1.5 font-mono">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-red" />
                    {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
                  </span>
                ) : (
                  "Click on map to set location"
                )
              }
            />
            <InfoBox
              title="Rental Details"
              value={`${data.rentalDays ?? "—"} days • ${
                data.price !== null ? formatCurrency(data.price) : "—"
              } • Contact: ${data.phone || "—"}`}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => pin && onContinue(pin)}
              disabled={!pin}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red py-3 text-sm font-semibold text-white transition hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Complete Your Booking <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onBack}
              className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-red bg-gray-50 p-4">
      <h3 className="mb-1 font-heading text-xs font-bold uppercase tracking-wide text-navy">
        {title}
      </h3>
      <div className="text-sm text-gray-600">{value}</div>
    </div>
  );
}

function ManualPinFallback({
  status,
  pin,
  onSetPin,
}: {
  status: Status;
  pin: Pin | null;
  onSetPin: (pin: Pin) => void;
}) {
  const messages: Record<string, string> = {
    "no-key": "No Google Maps API key is configured yet, so the satellite map can't load.",
    "geocode-error": "We couldn't automatically locate that address on the map.",
    "script-error": "Google Maps failed to load. Double-check your API key.",
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-white p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div className="flex-1">
          <p className="text-sm font-medium text-navy">{messages[status]}</p>
          <p className="mt-1 text-xs text-gray-500">
            {status === "no-key"
              ? "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local, or paste it directly near the top of components/steps/StepLocation.tsx."
              : "You can enter the drop coordinates manually below to continue."}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-navy">Latitude</span>
              <input
                type="number"
                step="any"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-navy outline-none focus:ring-2 focus:ring-navy-light"
                value={pin?.lat ?? ""}
                onChange={(e) => onSetPin({ lat: Number(e.target.value), lng: pin?.lng ?? 0 })}
                placeholder="42.3684"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-navy">Longitude</span>
              <input
                type="number"
                step="any"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-navy outline-none focus:ring-2 focus:ring-navy-light"
                value={pin?.lng ?? ""}
                onChange={(e) => onSetPin({ lat: pin?.lat ?? 0, lng: Number(e.target.value) })}
                placeholder="-83.3616"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
