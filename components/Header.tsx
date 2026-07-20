import { Phone, Trash2 } from "lucide-react";
import { COMPANY } from "@/lib/pricing";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-navy text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red">
            <Trash2 className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight sm:text-xl">
            {COMPANY.name}
          </span>
        </div>
        <a
          href={COMPANY.phoneHref}
          className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/20 sm:px-4"
        >
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">{COMPANY.phone}</span>
        </a>
      </div>
    </header>
  );
}
