"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Phone, X } from "lucide-react";
import { COMPANY } from "@/lib/pricing";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-red bg-gradient-to-br from-navy to-navy-light text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="flex min-w-0 items-center gap-2 sm:gap-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-red to-red-dark text-sm font-extrabold shadow-md shadow-red/30 sm:h-11 sm:w-11 sm:text-lg">
            DRZ
          </div>
          <span className="truncate font-heading text-base font-bold tracking-tight sm:text-lg md:text-xl">
            Dumpster Rental Zone
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 text-right sm:flex">
          <Link href="/commercial" className="text-sm font-semibold text-white/90 hover:text-white">
            Commercial
          </Link>
          <Link href="/contact" className="text-sm font-semibold text-white/90 hover:text-white">
            Contact Us
          </Link>
          <Link href="/commercial/login" className="text-sm font-semibold text-white/90 hover:text-white">
            Commercial Login
          </Link>
          <div>
            <p className="text-sm text-white/80">Professional Waste Management Solutions</p>
            <a href={COMPANY.phoneHref} className="text-sm font-semibold text-white hover:text-white/80">
              {COMPANY.phone}
            </a>
          </div>
        </div>

        {/* Mobile controls: a tap-to-call icon plus a menu for the links that
            have nowhere else to live below the sm breakpoint. */}
        <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
          <a
            href={COMPANY.phoneHref}
            aria-label={`Call ${COMPANY.phone}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            <Phone className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-white/10 bg-navy px-4 py-3 sm:hidden">
          <Link
            href="/commercial"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
          >
            Commercial
          </Link>
          <Link
            href="/commercial/login"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
          >
            Commercial Login
          </Link>
          <Link
            href="/contact"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
          >
            Contact Us
          </Link>
          <a
            href={COMPANY.phoneHref}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
          >
            Call {COMPANY.phone}
          </a>
        </nav>
      )}
    </header>
  );
}
