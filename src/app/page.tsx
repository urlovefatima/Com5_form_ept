import Link from "next/link";
import { ArrowUpRight, Layers, PenLine, Send, Shapes } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import CommissionCard from "@/components/CommissionCard";
import Reveal from "@/components/Reveal";
import { getCommissions } from "@/lib/commissions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const commissions = await getCommissions();

  return (
    <main className="min-h-screen bg-sky-50">
      {/* HERO */}
      <div className="p-2.5 sm:p-4">
        <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-navy-950 text-white sm:rounded-[2.25rem]">
          <img src="/images/promo.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_35%]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(6,22,41,.88)_0%,rgba(11,37,69,.7)_45%,rgba(11,37,69,.25)_100%)]" />

          <header className="flex items-center justify-between gap-3 p-4 sm:p-6">
            <Link href="/" className="flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-2 pr-4 text-navy-900 shadow-lg">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-950"><img src="/images/emblem-ept.png" alt="" className="h-4 w-auto" /></span>
              <span className="text-sm font-extrabold tracking-tight">COM5</span>
            </Link>
            <nav className="flex items-center gap-2">
              <div className="hidden items-center rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-md md:flex">
                <a href="#commissions" className="rounded-full px-4 py-1.5 text-sm font-semibold text-white/90 transition hover:bg-white/15">Commissions</a>
                <a href="#comment" className="rounded-full px-4 py-1.5 text-sm font-semibold text-white/90 transition hover:bg-white/15">Comment ça marche</a>
              </div>
              <a href="#commissions" className="inline-flex items-center gap-2 rounded-full bg-navy-900/90 py-2 pl-4 pr-2 text-sm font-semibold backdrop-blur transition hover:bg-navy-800">
                Participer <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15"><ArrowUpRight className="h-3.5 w-3.5" /></span>
              </a>
            </nav>
          </header>

          <div className="px-5 pb-8 pt-10 sm:px-12 sm:pb-12 sm:pt-16 lg:pt-20">
            <Reveal>
              <span className="inline-flex rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold text-white/90 backdrop-blur">École Polytechnique de Thiès · Your Voice, Our Roadmap</span>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="mt-5 max-w-3xl text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
                Ton avis <span className="font-display font-medium italic text-gold-300">aussi</span> compte&nbsp;!
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
                Une promotion, cinq commissions, une vision commune. Partage tes idées pour construire la feuille de route de notre dernière année.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <a href="#commissions" className="mt-8 inline-flex items-center gap-3 rounded-full bg-white py-2 pl-6 pr-2 font-semibold text-navy-900 shadow-xl transition hover:-translate-y-0.5">
                Choisir une commission
                <span className="grid h-10 w-10 place-items-center rounded-full bg-navy-900 text-white"><ArrowUpRight className="h-5 w-5" /></span>
              </a>
            </Reveal>

            {/* Accès rapide en verre dépoli */}
            <div className="-mx-5 mt-10 flex snap-x gap-2.5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:mt-14 sm:px-0 lg:justify-end">
              {commissions.map((c) => (
                <Link key={c.slug} href={`/contribuer/${c.slug}`}
                  className="group flex shrink-0 snap-start items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 p-1.5 pr-3.5 backdrop-blur-md transition hover:bg-white/20">
                  <img src={c.image} alt="" className="h-10 w-10 rounded-xl object-cover" />
                  <span className="text-[13px] font-semibold">{c.shortName}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-white/60 transition group-hover:rotate-45 group-hover:text-white" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* COMMISSIONS */}
      <section id="commissions" className="relative scroll-mt-4 px-4 pb-16 pt-12 sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-4xl font-extrabold tracking-[-0.03em] text-navy-950 sm:text-5xl">
              Choisis ta <span className="inline-block rounded-full bg-white px-4 py-0.5 shadow-sm">commission</span>
            </h2>
            <p className="max-w-xs text-[15px] leading-relaxed text-muted">Un thème, un titre, ton idée. Moins de deux minutes, avec ou sans ton nom.</p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-x-5 lg:gap-y-7 lg:pb-8">
            {commissions.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 3) * 0.06} className={i % 3 === 1 ? "lg:translate-y-8" : ""}>
                <CommissionCard c={c} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="comment" className="scroll-mt-4 px-4 pb-14 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-[1.75rem] bg-white p-6 sm:p-10">
          <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-navy-950 sm:text-3xl">Comment ça marche</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Layers, t: "Choisis une commission" },
              { icon: Shapes, t: "Sélectionne un thème" },
              { icon: PenLine, t: "Donne un titre et décris ton idée" },
              { icon: Send, t: "Envoie, c'est tout !" },
            ].map(({ icon: Icon, t }, i) => (
              <li key={t} className="flex items-center gap-3 rounded-2xl bg-sky-50 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-900 text-gold-300"><Icon className="h-[18px] w-[18px]" /></span>
                <span className="text-[15px] font-semibold text-navy-900"><span className="text-muted">{i + 1}. </span>{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
