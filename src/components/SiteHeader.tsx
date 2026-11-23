import Link from "next/link";

export default function SiteHeader({ dark = true }: { dark?: boolean }) {
  return (
    <header className={`absolute inset-x-0 top-0 z-30 ${dark ? "text-white" : "text-navy-900"}`}>
      <div className="container-x flex h-20 items-center justify-between">
        <Link href="/" className="group flex items-center gap-3" aria-label="Accueil COM5">
          <img src="/images/emblem-ept.png" alt="" className="h-9 w-auto transition-transform duration-500 group-hover:rotate-[-6deg]" />
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold tracking-tight">COM5</span>
            <span className={`block text-[10px] font-semibold uppercase tracking-[0.18em] ${dark ? "text-white/60" : "text-muted"}`}>École Polytechnique de Thiès</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <Link href="/#commissions" className={`${dark ? "text-white/75 hover:text-white" : "text-muted hover:text-navy-900"} transition`}>Commissions</Link>
          <Link href="/#comment" className={`${dark ? "text-white/75 hover:text-white" : "text-muted hover:text-navy-900"} transition`}>Comment ça marche</Link>
          <Link href="/#commissions" className={dark ? "btn-ghost-dark !py-2" : "btn-ghost !py-2"}>Partager mes idées</Link>
        </nav>
      </div>
    </header>
  );
}
