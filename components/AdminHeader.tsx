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
  Tag,
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

export default function AdminHeader({
  icon: Icon,
  subtitle,
  current,
}: {
  icon: LucideIcon;
  subtitle: string;
  current: AdminNavKey;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = NAV_ITEMS.filter((item) => item.key !== current);

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
