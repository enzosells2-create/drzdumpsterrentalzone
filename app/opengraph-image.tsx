import { ImageResponse } from "next/og";
import { COMPANY } from "@/lib/pricing";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f2340, #1e3a5f)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 24,
            background: "linear-gradient(135deg, #e53935, #c62828)",
            fontSize: 44,
            fontWeight: 800,
            marginBottom: 32,
          }}
        >
          DRZ
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800 }}>
          {COMPANY.name}
        </div>
        <div style={{ display: "flex", marginTop: 16, fontSize: 30, color: "rgba(255,255,255,0.85)" }}>
          {COMPANY.serviceArea}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 36,
            fontWeight: 700,
            color: "#ef5350",
          }}
        >
          {COMPANY.phone}
        </div>
      </div>
    ),
    { ...size }
  );
}
