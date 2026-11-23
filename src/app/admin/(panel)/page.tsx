import Link from "next/link";
import { ArrowRight, EyeOff, Inbox, Lightbulb, NotebookPen, Users } from "lucide-react";
import { getStats } from "../../../lib/queries";
import { authorLabel, formatDate } from "../../../lib/format";
import ExportButtons from "../../../components/admin/ExportButtons";

export default async function Dashboard() {
  const s = await getStats();
  const max = Math.max(1, ...s.perCommission.map((c) => c.proposals));
  const cards = [
    { label: "Contributions reçues", value: s.contributions, icon: Inbox, hint: "envois de formulaire" },
    { label: "Propositions", value: s.proposals, icon: Lightbulb, hint: "idées au total" },
    { label: "Participants identifiés", value: s.identified, icon: Users, hint: "noms distincts" },
    { label: "Contributions anonymes", value: s.anonymous, icon: EyeOff, hint: `${s.notes} note${s.notes > 1 ? "s" : ""} spéciale${s.notes > 1 ? "s" : ""}` },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-gold-600">Tableau de bord</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-navy-900">La voix de la promo</h1>
          <p className="mt-1 text-muted">Données en temps réel issues de la base.</p>
        </div>
        <ExportButtons scope="all" label="Tout exporter" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, hint }, i) => (
          <div key={label} className={`card p-6 ${i === 0 ? "!bg-navy-900 text-white" : ""}`}>
            <div className="flex items-center justify-between">
              <p className={`text-sm font-medium ${i === 0 ? "text-white/70" : "text-muted"}`}>{label}</p>
              <Icon className={`h-5 w-5 ${i === 0 ? "text-gold-300" : "text-navy-700"}`} />
            </div>
            <p className={`mt-3 font-display text-5xl font-semibold ${i === 0 ? "" : "text-navy-900"}`}>{value}</p>
            <p className={`mt-1 text-xs ${i === 0 ? "text-white/50" : "text-muted"}`}>{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="card p-6 sm:p-7">
          <h2 className="font-display text-xl font-semibold text-navy-900">Propositions par commission</h2>
          <ul className="mt-6 space-y-5">
            {s.perCommission.map((c) => (
              <li key={c.slug}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <Link href={`/admin/propositions?commission=${c.slug}`} className="font-semibold text-navy-900 hover:underline">{c.short_name}</Link>
                  <span className="text-muted"><strong className="text-navy-900">{c.proposals}</strong> prop. · {c.contributions} contrib.</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-sky-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-navy-700 to-navy-500" style={{ width: `${(c.proposals / max) * 100}%` }} />
                </div>
                <div className="mt-2"><ExportButtons scope={c.slug} compact label="Télécharger" /></div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-navy-900">Dernières propositions</h2>
            <Link href="/admin/propositions" className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700 hover:underline">Tout voir <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {s.latest.length === 0 ? (
            <div className="mt-10 rounded-2xl border-2 border-dashed border-navy-900/10 p-8 text-center text-sm text-muted">
              Aucune contribution pour le moment.<br />Partage le lien du site avec la promotion&nbsp;!
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-navy-900/[0.06]">
              {s.latest.map((p) => (
                <li key={p.id} className="py-3.5">
                  <p className="text-xs font-semibold text-gold-600">{s.perCommission.find((c) => c.slug === p.commissionSlug)?.short_name} · {p.categoryLabel}</p>
                  <p className="mt-0.5 font-semibold text-navy-900">{p.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    {p.isAnonymous && <EyeOff className="h-3 w-3" />}{authorLabel(p)} · {formatDate(p.createdAt)}
                    {p.specialNote && <span className="inline-flex items-center gap-1 text-gold-600"><NotebookPen className="h-3 w-3" /> note</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
