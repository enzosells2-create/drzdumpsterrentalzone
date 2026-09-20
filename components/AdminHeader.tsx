"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  LucideIcon,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { COMPANY } from "@/lib/pricing";

export type AdminNavKey = "bookings" | "commercial" | "messages" | "promo-codes";

const NAV_ITEMS: { key: AdminNavKey; href: string; label: string; icon: LucideIcon }[] = [
  { key: "bookings", href: "/admin", label: "Bookings", icon: ArrowLeft },
  { key: "commercial", href: "/admin/commercial", label: "Commercial", icon: Briefcase },
  { key: "messages", href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { key: "promo-codes", href: "/admin/promo-codes", label: "Promo Codes", icon: Tag },
];

// Not a tab within the admin nav — it's a separate login (employees don't
// get the admin password), so it always shows and opens in a new tab.
const EMPLOYEE_LINK = { href: "/employee", label: "Deliveries", icon: Truck };

// A Server Component can't hand a component reference (like a Lucide icon)
// across the server/client boundary — only plain serializable props. Pages
// that render AdminHeader from a Server Component (e.g. app/admin/*/page.tsx)
// pass one of these string keys instead; AdminHeader resolves the icon
// itself. Client-component callers may still pass either form.
const ICONS = { trash: Trash2, briefcase: Briefcase, message: MessageSquare, tag: Tag, plus: PlusCircle } as const;
export type AdminIconKey = keyof typeof ICONS;

export default function AdminHeader({
  icon,
  subtitle,
  current,
}: {
  icon: LucideIcon | AdminIconKey;
  subtitle: string;
  /** Omit on a sub-page (e.g. "New Booking") to show every nav link, including
   * the one back to its own section. */
  current?: AdminNavKey;
}) {
  const Icon = typeof icon === "string" ? ICONS[icon] : icon;
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = current ? NAV_ITEMS.filter((item) => item.key !== current) : NAV_ITEMS;

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-red bg-gradient-to-br from-navy to-navy-light text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-red to-red-dark sm:h-10 sm:w-10">
            <Icon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-bold leading-tight sm:text-lg">
              {COMPANY.name}
            </p>
            <p className="truncate text-xs text-white/70">{subtitle}</p>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 sm:flex">
          {links.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
          <a
            href={EMPLOYEE_LINK.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold transition hover:bg-white/20"
          >
            <EMPLOYEE_LINK.icon className="h-4 w-4" /> {EMPLOYEE_LINK.label}
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold transition hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 sm:hidden"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-white/10 bg-navy px-4 py-3 sm:hidden">
          {links.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
          <a
            href={EMPLOYEE_LINK.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
          >
            <EMPLOYEE_LINK.icon className="h-4 w-4" /> {EMPLOYEE_LINK.label}
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-white/90 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </nav>
      )}
    </header>
  );
}
