import Link from "next/link";
import { COMPANY } from "@/lib/pricing";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-red bg-gradient-to-br from-navy to-navy-light text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-red to-red-dark text-lg font-extrabold shadow-md shadow-red/30">
            DRZ
          </div>
          <span className="font-heading text-lg font-bold tracking-tight sm:text-xl">
            Dumpster Rental Zone
          </span>
        </Link>
        <div className="hidden items-center gap-6 text-right sm:flex">
          <Link href="/contact" className="text-sm font-semibold text-white/90 hover:text-white">
            Contact Us
          </Link>
          <div>
            <p className="text-sm text-white/80">Professional Waste Management Solutions</p>
            <a href={COMPANY.phoneHref} className="text-sm font-semibold text-white hover:text-white/80">
              {COMPANY.phone}
            </a>
          </div>
        </div>
        <a
          href={COMPANY.phoneHref}
          className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/20 sm:hidden"
        >
          {COMPANY.phone}
        </a>
      </div>
    </header>
  );
}
