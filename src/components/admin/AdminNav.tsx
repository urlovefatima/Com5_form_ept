"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LayoutDashboard, ListChecks, LogOut, Settings2 } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/propositions", label: "Propositions", icon: ListChecks },
  { href: "/admin/commissions", label: "Commissions", icon: Settings2 },
];

export default function AdminNav({ username }: { username: string }) {
  const path = usePathname();
  const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); window.location.href = "/admin/login"; };
  return (
    <aside className="sticky top-0 z-30 bg-navy-950 text-white lg:h-screen lg:w-64 lg:shrink-0">
      <div className="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:px-6 lg:py-8">
        <Link href="/admin" className="flex items-center gap-3">
          <img src="/images/emblem-ept.png" alt="" className="h-8" />
          <span className="leading-tight"><span className="block font-display text-lg font-semibold">COM5</span><span className="block text-[10px] uppercase tracking-[0.18em] text-white/50">Administration</span></span>
        </Link>
        <button onClick={logout} className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Déconnexion"><LogOut className="h-5 w-5" /></button>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:mt-4 lg:flex-col lg:px-4">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${active ? "bg-white text-navy-900" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
              <Icon className={`h-4 w-4 ${active ? "text-gold-600" : ""}`} /> {label}
            </Link>
          );
        })}
        <Link href="/" target="_blank" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/50 transition hover:bg-white/10 hover:text-white">
          <ExternalLink className="h-4 w-4" /> Voir le site
        </Link>
      </nav>
      <div className="absolute bottom-0 hidden w-full border-t border-white/10 p-5 lg:block">
        <p className="text-xs text-white/40">Connecté·e en tant que</p>
        <p className="truncate text-sm font-semibold">{username}</p>
        <button onClick={logout} className="mt-3 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"><LogOut className="h-4 w-4" /> Déconnexion</button>
      </div>
    </aside>
  );
}
