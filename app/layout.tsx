import type { Metadata } from "next";
import { Inter, Poppins, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DRZ Dumpster Rental | Livingston, Wayne, Oakland & Macomb Counties, MI",
  description:
    "Fast, affordable dumpster rentals in Southeast Michigan. 5, 10, 15, and 20 yard dumpsters with 2 tons included and fast delivery & pickup. Call (734) 366-4865.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${caveat.variable}`}
    >
      <body className="font-sans text-navy antialiased">{children}</body>
    </html>
  );
}
