import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-navy-950 text-white/60">
      <div className="container-x flex flex-col items-center justify-between gap-6 py-10 text-sm sm:flex-row">
        <div className="flex items-center gap-3">
          <img src="/images/emblem-ept.png" alt="" className="h-7 w-auto opacity-90" />
          <span>COM5 · Commission des élèves de 5ᵉ année · EPT</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="italic text-white/45">Une promotion, cinq commissions, une vision commune.</span>
          <Link href="/admin" className="text-white/35 transition hover:text-white/80">Espace COM5</Link>
        </div>
      </div>
    </footer>
  );
}
