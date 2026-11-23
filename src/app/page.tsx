import Link from "next/link";
import { ArrowDown, EyeOff, Layers, Timer, MousePointerClick, PenLine, Send, Sparkles } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CommissionCard from "@/components/CommissionCard";
import Reveal from "@/components/Reveal";
import { getCommissions } from "@/lib/commissions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const commissions = await getCommissions();
  const main = commissions.filter((c) => c.slug !== "coordination");
  const coordination = commissions.find((c) => c.slug === "coordination");

  return (
    <main>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-navy-950 text-white">
        <img src="/images/promo.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_40%] opacity-30" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(29,78,137,.55),transparent_60%),linear-gradient(180deg,rgba(6,22,41,.55)_0%,rgba(6,22,41,.92)_75%,#061629_100%)]" />
        <SiteHeader />
        <div className="container-x pb-24 pt-36 sm:pb-32 sm:pt-44">
          <Reveal>
            <p className="eyebrow inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-gold-300">
              <Sparkles className="h-3.5 w-3.5" /> COM5 · Your Voice, Our Roadmap
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-7 max-w-4xl font-display text-[2.9rem] font-semibold leading-[1.02] tracking-tight sm:text-7xl lg:text-[5.4rem]">
              Ton avis <em className="font-medium italic text-gold-400">aussi</em> compte&nbsp;!
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-2xl font-display text-xl italic text-sky-200 sm:text-2xl">
              Une promotion, cinq commissions, une vision commune.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              La feuille de route de notre dernière année à l&apos;EPT se construit <strong className="font-semibold text-white">collectivement</strong>.
              Choisis une commission, partage tes idées en quelques minutes — avec ou sans ton nom.
            </p>
          </Reveal>
          <Reveal delay={0.32} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="#commissions" className="btn-gold !px-8 !py-4 !text-base">Partager mes idées <ArrowDown className="h-4 w-4" /></Link>
            <Link href="#comment" className="btn-ghost-dark !px-8 !py-4 !text-base">Comment ça marche</Link>
          </Reveal>
          <Reveal delay={0.4}>
            <dl className="mt-16 grid max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-3">
              {[
                { icon: Layers, t: "6 espaces", d: "5 commissions + la coordination" },
                { icon: EyeOff, t: "Anonymat possible", d: "Ton nom est facultatif" },
                { icon: Timer, t: "≈ 5 minutes", d: "Brouillon gardé automatiquement" },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex items-start gap-3 bg-navy-950/60 p-5 backdrop-blur">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
                  <div><dt className="font-semibold">{t}</dt><dd className="text-sm text-white/55">{d}</dd></div>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* INTRO */}
      <section className="relative bg-white">
        <div className="container-x grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <p className="eyebrow text-gold-600">Le mot de la COM5</p>
            <blockquote className="mt-5 font-display text-2xl leading-snug text-navy-900 sm:text-[2rem]">
              « La dernière année à l&apos;EPT est une étape importante de notre parcours. Nous souhaitons en faire une expérience
              <span className="italic text-navy-700"> enrichissante, inclusive et mémorable</span> pour tous. »
            </blockquote>
            <p className="mt-6 max-w-xl leading-relaxed text-muted">
              Cette plateforme vous donne la possibilité de contribuer directement aux initiatives de votre promotion.
              Vos idées comptent : participez à la construction de notre feuille de route !
            </p>
          </Reveal>
          <Reveal delay={0.1} className="relative">
            <div className="absolute -inset-3 -z-0 rotate-2 rounded-[2rem] bg-gold-400/25" />
            <img src="/images/promo.jpg" alt="La promotion réunie en tenue dans l'amphithéâtre de l'EPT" loading="lazy"
              className="relative aspect-[16/10] w-full rounded-[1.75rem] object-cover shadow-2xl" />
          </Reveal>
        </div>
      </section>

      {/* COMMISSIONS */}
      <section id="commissions" className="scroll-mt-6 bg-sky-50">
        <div className="container-x py-20 sm:py-28">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-navy-700">Six espaces de contribution</p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-navy-900 sm:text-5xl">Où veux-tu faire entendre ta voix&nbsp;?</h2>
            <p className="mt-4 text-muted">Chaque commission a son propre formulaire, avec des catégories pensées pour ses missions.</p>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {main.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 3) * 0.08} className="h-full">
                <CommissionCard c={c} index={i + 1} />
              </Reveal>
            ))}
            {coordination && (
              <Reveal delay={0.16} className="h-full">
                <CommissionCard c={coordination} index={6} featured={false} />
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* COMMENT */}
      <section id="comment" className="scroll-mt-6 bg-navy-900 text-white">
        <div className="container-x py-20 sm:py-24">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-gold-400">Comment ça marche</p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Quatre étapes, zéro paperasse.</h2>
          </Reveal>
          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MousePointerClick, t: "Choisis une commission", d: "Celle qui te parle le plus — tu pourras revenir pour les autres." },
              { icon: Layers, t: "Sélectionne une catégorie", d: "Formations, sorties, sponsors, examens… chaque espace a les siennes." },
              { icon: PenLine, t: "Décris ton idée", d: "Objectif, organisation, budget, période. Ajoute autant d'idées que tu veux." },
              { icon: Send, t: "Envoie", d: "Ta contribution arrive directement à la COM5 pour bâtir la feuille de route." },
            ].map(({ icon: Icon, t, d }, i) => (
              <Reveal key={t} delay={i * 0.08}>
                <li className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-gold-400/40 hover:bg-white/[0.07]">
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-400/15 text-gold-300"><Icon className="h-5 w-5" /></span>
                    <span className="font-display text-4xl italic text-white/15">{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{d}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal className="mt-14 flex justify-center">
            <Link href="#commissions" className="btn-gold !px-8 !py-4 !text-base">Je participe</Link>
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
