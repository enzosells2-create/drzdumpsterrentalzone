import Link from "next/link";
import { COMPANY, SERVICE_CITIES, SOCIAL_LINKS } from "@/lib/pricing";

const SOCIAL_LABELS: Record<keyof typeof SOCIAL_LINKS, string> = {
  facebook: "Facebook",
};

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-heading text-lg font-bold text-navy">{COMPANY.name}</p>
            <a href={COMPANY.phoneHref} className="mt-1 block text-sm font-semibold text-red hover:text-red-dark">
              {COMPANY.phone}
            </a>
            <p className="mt-1 text-sm text-gray-500">{COMPANY.serviceArea}</p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-navy">
              Home
            </Link>
            <Link href="/commercial" className="hover:text-navy">
              Commercial
            </Link>
            <Link href="/contact" className="hover:text-navy">
              Contact Us
            </Link>
            <Link href="/commercial/login" className="hover:text-navy">
              Commercial Login
            </Link>
            {Object.entries(SOCIAL_LINKS).map(([key, href]) => (
              <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="hover:text-navy">
                {SOCIAL_LABELS[key as keyof typeof SOCIAL_LINKS]}
              </a>
            ))}
          </nav>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-gray-400">
          Proudly serving {SERVICE_CITIES.join(", ")}, and every town within 75 miles of South
          Lyon, Michigan.
        </p>
        <p className="mt-3 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
