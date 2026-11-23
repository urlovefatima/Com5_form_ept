"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, CircleAlert, Copy, EyeOff, Loader2, NotebookPen, Plus, RotateCcw, Send, Trash2, UserRound,
} from "lucide-react";
import type { Commission } from "@/lib/types";

type Budget = "unspecified" | "none" | "unknown" | "amount";
type Proposal = {
  uid: string;
  categoryId: string;
  title: string;
  description: string;
  objective: string;
  organization: string;
  budgetType: Budget;
  budgetAmount: string;
  period: string;
  inclusion: string;
  specialNote: string;
  extra: Record<string, string>;
};
type Identity = { anonymous: boolean; fullName: string; department: string };
type Errors = Record<string, string>;

const STEPS = ["Toi", "Tes idées", "Relecture"] as const;
const PERIODS = ["Dès que possible", "Avant les PFE", "Pendant les PFE", "Après les soutenances", "Toute l'année"];

const uid = () => Math.random().toString(36).slice(2, 10);
const emptyProposal = (): Proposal => ({
  uid: uid(), categoryId: "", title: "", description: "", objective: "", organization: "",
  budgetType: "unspecified", budgetAmount: "", period: "", inclusion: "", specialNote: "", extra: {},
});

function validateProposal(p: Proposal): Errors {
  const e: Errors = {};
  if (!p.categoryId) e.categoryId = "Choisis une catégorie pour ton idée.";
  if (p.title.trim().length < 3) e.title = "Donne un titre à ta proposition (3 caractères min.).";
  if (p.description.trim().length < 10) e.description = "Décris ton idée en quelques phrases (10 caractères min.).";
  if (p.budgetType === "amount" && !p.budgetAmount.trim()) e.budgetAmount = "Indique un montant ou choisis une autre option.";
  return e;
}

export default function ContributionForm({
  commission, departments, others,
}: { commission: Commission; departments: string[]; others: { slug: string; shortName: string }[] }) {
  const storageKey = `com5:draft:${commission.slug}`;
  const [step, setStep] = useState(0);
  const [identity, setIdentity] = useState<Identity>({ anonymous: false, fullName: "", department: "" });
  const [proposals, setProposals] = useState<Proposal[]>([emptyProposal()]);
  const [open, setOpen] = useState(0);
  const [errors, setErrors] = useState<Record<string, Errors>>({});
  const [identityError, setIdentityError] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [restored, setRestored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const startedAt = useRef(Date.now());
  const topRef = useRef<HTMLDivElement>(null);
  const [sentCount, setSentCount] = useState(0);

  const categoryLabel = useMemo(() => new Map(commission.categories.map((c) => [c.id, c.label])), [commission.categories]);

  // Restauration du brouillon (confort uniquement : la vraie sauvegarde se fait en base à l'envoi)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.proposals?.length) {
          setIdentity({ ...identity, ...d.identity });
          setProposals(d.proposals.map((p: Proposal) => ({ ...emptyProposal(), ...p })));
          if (typeof d.step === "number") setStep(Math.min(d.step, 1));
          setRestored(true);
        }
      }
    } catch { /* stockage indisponible : on continue sans brouillon */ }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded || status === "success") return;
    try { localStorage.setItem(storageKey, JSON.stringify({ identity, proposals, step, savedAt: Date.now() })); } catch {}
  }, [identity, proposals, step, loaded, status, storageKey]);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const update = (i: number, patch: Partial<Proposal>) => {
    setProposals((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));
    if (errors[proposals[i]?.uid]) {
      const keys = Object.keys(patch);
      setErrors((e) => {
        const cur = { ...(e[proposals[i].uid] || {}) };
        keys.forEach((k) => delete cur[k]);
        if (patch.budgetType) delete cur.budgetAmount;
        return { ...e, [proposals[i].uid]: cur };
      });
    }
  };

  const validateAll = () => {
    const all: Record<string, Errors> = {};
    let firstBad = -1;
    proposals.forEach((p, i) => {
      const e = validateProposal(p);
      if (Object.keys(e).length) { all[p.uid] = e; if (firstBad < 0) firstBad = i; }
    });
    setErrors(all);
    return firstBad;
  };

  const goNext = () => {
    if (step === 0) {
      if (!identity.anonymous && identity.fullName.trim().length < 2) {
        setIdentityError("Indique ton nom, ou choisis de contribuer anonymement.");
        return;
      }
      setIdentityError("");
      setStep(1); scrollTop(); return;
    }
    if (step === 1) {
      const bad = validateAll();
      if (bad >= 0) { setOpen(bad); setTimeout(() => document.getElementById(`p-${proposals[bad].uid}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); return; }
      setStep(2); scrollTop();
    }
  };

  const addProposal = () => {
    const bad = validateAll();
    if (bad >= 0) { setOpen(bad); return; }
    setProposals((ps) => [...ps, emptyProposal()]);
    setOpen(proposals.length);
    setTimeout(() => window.scrollBy({ top: 200, behavior: "smooth" }), 80);
  };

  const duplicate = (i: number) => {
    const copy = { ...proposals[i], uid: uid(), title: proposals[i].title + " (variante)" };
    setProposals((ps) => [...ps.slice(0, i + 1), copy, ...ps.slice(i + 1)]);
    setOpen(i + 1);
  };

  const remove = (i: number) => {
    setProposals((ps) => (ps.length === 1 ? [emptyProposal()] : ps.filter((_, j) => j !== i)));
    setOpen(Math.max(0, i - 1));
  };

  const resetDraft = () => {
    try { localStorage.removeItem(storageKey); } catch {}
    setIdentity({ anonymous: false, fullName: "", department: "" });
    setProposals([emptyProposal()]); setOpen(0); setStep(0); setErrors({}); setRestored(false);
  };

  const submit = async () => {
    if (validateAll() >= 0) { setStep(1); return; }
    setStatus("submitting"); setServerError("");
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionSlug: commission.slug,
          anonymous: identity.anonymous,
          fullName: identity.anonymous ? "" : identity.fullName,
          department: identity.department,
          proposals: proposals.map(({ uid: _u, ...p }) => ({
            ...p,
            budgetAmount: p.budgetType === "amount" ? p.budgetAmount : "",
            extra: Object.fromEntries(Object.entries(p.extra).filter(([, v]) => v.trim())),
          })),
          website,
          startedAt: startedAt.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "L'envoi a échoué. Réessaie dans un instant.");
      setSentCount(proposals.length);
      setStatus("success");
      try { localStorage.removeItem(storageKey); } catch {}
      scrollTop();
    } catch (err) {
      setStatus("error");
      setServerError(err instanceof Error ? err.message : "L'envoi a échoué.");
    }
  };

  const progress = status === "success" ? 100 : ((step + (step === 2 ? 0.5 : 0.35)) / STEPS.length) * 100;

  return (
    <main className="min-h-screen bg-sky-50">
      {/* Bandeau commission */}
      <section className="relative isolate overflow-hidden bg-navy-950 text-white">
        <img src={commission.image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-900/40" />
        <div className="container-x pb-10 pt-6 sm:pb-14">
          <div className="flex items-center justify-between">
            <Link href="/#commissions" className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" /> Toutes les commissions
            </Link>
            <Link href="/" aria-label="Accueil"><img src="/images/emblem-ept.png" alt="" className="h-8" /></Link>
          </div>
          <p className="eyebrow mt-10 text-gold-300">COM5 · Espace de contribution</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{commission.name}</h1>
          <p className="mt-2 font-display text-lg italic text-sky-200">{commission.tagline}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-[15px]">{commission.description}</p>
        </div>
      </section>

      <div ref={topRef} className="scroll-mt-4" />

      {/* Progression */}
      <div className="sticky top-0 z-20 border-b border-navy-900/5 bg-sky-50/85 backdrop-blur-md">
        <div className="container-x py-4">
          <ol className="flex items-center gap-2 sm:gap-4">
            {STEPS.map((s, i) => {
              const done = status === "success" || i < step;
              const active = status !== "success" && i === step;
              return (
                <li key={s} className="flex flex-1 items-center gap-2 sm:gap-3">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-all duration-500
                    ${done ? "bg-navy-900 text-white" : active ? "bg-gold-400 text-navy-950 ring-4 ring-gold-400/25" : "bg-white text-muted ring-1 ring-navy-900/10"}`}>
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={`hidden text-sm font-semibold sm:block ${active ? "text-navy-900" : "text-muted"}`}>{s}</span>
                  {i < STEPS.length - 1 && <span className="h-px flex-1 bg-navy-900/10" />}
                </li>
              );
            })}
          </ol>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-navy-900/[0.06]">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-navy-700 to-gold-400" animate={{ width: `${progress}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
          </div>
        </div>
      </div>

      <div className="container-x max-w-3xl py-10 sm:py-14">
        {restored && status !== "success" && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-navy-700/15 bg-white px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2 text-navy-900"><NotebookPen className="h-4 w-4 text-gold-600" /> Ton brouillon a été restauré sur cet appareil.</span>
            <button onClick={resetDraft} className="inline-flex items-center gap-1.5 self-start font-semibold text-muted transition hover:text-red-600"><RotateCcw className="h-3.5 w-3.5" /> Recommencer à zéro</button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="card overflow-hidden text-center">
              <div className="bg-gradient-to-b from-sky-100 to-white px-6 pb-4 pt-14">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.15 }}
                  className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-navy-900 text-gold-300 shadow-xl">
                  <Check className="h-10 w-10" strokeWidth={2.5} />
                </motion.div>
                <h2 className="mt-7 font-display text-3xl font-semibold text-navy-900 sm:text-4xl">Merci, c&apos;est bien reçu&nbsp;!</h2>
                <p className="mx-auto mt-3 max-w-md text-muted">
                  {sentCount > 1 ? `Tes ${sentCount} propositions ont été enregistrées` : "Ta proposition a été enregistrée"} pour l&apos;espace <strong className="text-navy-900">{commission.name}</strong>.
                  Merci de contribuer à la feuille de route de la promotion.
                </p>
              </div>
              <div className="px-6 pb-10 sm:px-10">
                <p className="eyebrow mt-4 text-muted">Une autre idée ? Contribue aussi à…</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {others.map((o) => (
                    <Link key={o.slug} href={`/contribuer/${o.slug}`} className="chip border-navy-900/10 bg-white text-navy-900 hover:border-navy-900 hover:bg-navy-900 hover:text-white">{o.shortName}</Link>
                  ))}
                </div>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <button onClick={() => { resetDraft(); setStatus("idle"); startedAt.current = Date.now(); }} className="btn-ghost">Nouvelle contribution ici</button>
                  <Link href="/" className="btn-navy">Retour à l&apos;accueil</Link>
                </div>
              </div>
            </motion.div>
          ) : step === 0 ? (
            <motion.section key="s0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35 }}>
              <StepTitle n={1} title="Faisons connaissance" sub="Ton nom aide la commission à revenir vers toi. Tu peux aussi rester anonyme." />
              <div className="card space-y-6 p-6 sm:p-8">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { v: false, icon: UserRound, t: "Je m'identifie", d: "Mon nom apparaîtra avec mes idées" },
                    { v: true, icon: EyeOff, t: "Je reste anonyme", d: "Aucun nom ne sera enregistré" },
                  ].map(({ v, icon: Icon, t, d }) => (
                    <button key={t} type="button" onClick={() => { setIdentity({ ...identity, anonymous: v }); setIdentityError(""); }}
                      aria-pressed={identity.anonymous === v}
                      className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-300
                        ${identity.anonymous === v ? "border-navy-900 bg-sky-100/70" : "border-navy-900/10 bg-white hover:border-navy-900/30"}`}>
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${identity.anonymous === v ? "bg-navy-900 text-gold-300" : "bg-sky-100 text-navy-700"}`}><Icon className="h-5 w-5" /></span>
                      <span><span className="block font-semibold text-navy-900">{t}</span><span className="text-sm text-muted">{d}</span></span>
                    </button>
                  ))}
                </div>
                <AnimatePresence initial={false}>
                  {!identity.anonymous && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <label className="label" htmlFor="fullName">Prénom et nom</label>
                      <input id="fullName" className={`input ${identityError ? "input-error" : ""}`} value={identity.fullName} maxLength={120} autoComplete="name"
                        placeholder="Ex. Awa Ndiaye" onChange={(e) => { setIdentity({ ...identity, fullName: e.target.value }); setIdentityError(""); }} />
                      {identityError && <FieldError msg={identityError} />}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div>
                  <label className="label" htmlFor="dept">Génie / département <span className="font-normal text-muted">(facultatif)</span></label>
                  <div className="relative">
                    <select id="dept" className="input appearance-none pr-10" value={identity.department} onChange={(e) => setIdentity({ ...identity, department: e.target.value })}>
                      <option value="">— Je préfère ne pas préciser —</option>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  </div>
                </div>
                <div className="rounded-2xl bg-sky-100/70 px-4 py-3 text-sm text-navy-900">
                  Commission concernée : <strong>{commission.name}</strong>
                </div>
                {/* Champ piège anti-robots, invisible pour les humains */}
                <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                  <label>Site web<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
                </div>
              </div>
              <NavButtons onNext={goNext} nextLabel="Passer à mes idées" />
            </motion.section>
          ) : step === 1 ? (
            <motion.section key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35 }}>
              <StepTitle n={2} title="Partage tes idées" sub="Une proposition = une idée. Ajoute-en autant que tu veux avant d'envoyer." />
              <div className="space-y-4">
                {proposals.map((p, i) => {
                  const e = errors[p.uid] || {};
                  const isOpen = open === i;
                  const hasErr = Object.keys(e).length > 0;
                  return (
                    <div key={p.uid} id={`p-${p.uid}`} className={`card scroll-mt-28 overflow-hidden transition-shadow ${hasErr ? "ring-2 ring-red-300" : isOpen ? "ring-2 ring-navy-900/10" : ""}`}>
                      <button type="button" onClick={() => setOpen(isOpen ? -1 : i)} className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-7" aria-expanded={isOpen}>
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-lg font-semibold ${isOpen ? "bg-navy-900 text-gold-300" : "bg-sky-100 text-navy-900"}`}>{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-navy-900">{p.title.trim() || "Nouvelle proposition"}</span>
                          <span className="block truncate text-xs text-muted">{categoryLabel.get(p.categoryId) ?? "Catégorie à choisir"}</span>
                        </span>
                        {hasErr && !isOpen && <CircleAlert className="h-5 w-5 text-red-500" />}
                        <ChevronDown className={`h-5 w-5 text-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                            <div className="space-y-8 border-t border-navy-900/[0.06] px-5 pb-7 pt-6 sm:px-7">
                              <Group title="Catégorie" hint="De quoi parle ton idée ?">
                                <div className="flex flex-wrap gap-2" role="radiogroup">
                                  {commission.categories.map((c) => {
                                    const sel = p.categoryId === c.id;
                                    return (
                                      <button key={c.id} type="button" role="radio" aria-checked={sel} onClick={() => update(i, { categoryId: c.id })}
                                        className={`chip ${sel ? "border-navy-900 bg-navy-900 text-white shadow-md" : "border-navy-900/12 bg-white text-navy-900 hover:border-navy-900/40 hover:bg-sky-50"}`}>
                                        {sel && <Check className="-ml-1 mr-1 inline h-3.5 w-3.5 text-gold-300" />}{c.label}
                                      </button>
                                    );
                                  })}
                                </div>
                                {e.categoryId && <FieldError msg={e.categoryId} />}
                              </Group>

                              <Group title="L'idée">
                                <Field label="Titre de la proposition" required error={e.title}>
                                  <input className={`input ${e.title ? "input-error" : ""}`} maxLength={160} value={p.title} placeholder="Un titre court et parlant"
                                    onChange={(ev) => update(i, { title: ev.target.value })} />
                                </Field>
                                <Field label="Description détaillée" required error={e.description} counter={`${p.description.length}/5000`}>
                                  <textarea className={`input min-h-36 resize-y ${e.description ? "input-error" : ""}`} maxLength={5000} value={p.description}
                                    placeholder="Explique ton idée : en quoi elle consiste, comment tu l'imagines…" onChange={(ev) => update(i, { description: ev.target.value })} />
                                </Field>
                              </Group>

                              <Group title="Pourquoi & comment">
                                <Field label="Objectif" hint="Pourquoi cette initiative est-elle intéressante pour la promo ?">
                                  <textarea className="input min-h-24 resize-y" maxLength={2000} value={p.objective} onChange={(ev) => update(i, { objective: ev.target.value })} />
                                </Field>
                                <Field label="Organisation proposée" hint="Comment pourrait-elle être mise en œuvre ? Étapes, responsables, partenaires…">
                                  <textarea className="input min-h-24 resize-y" maxLength={3000} value={p.organization} onChange={(ev) => update(i, { organization: ev.target.value })} />
                                </Field>
                                {commission.extraFields.map((f) => (
                                  <Field key={f.key} label={f.label}>
                                    {f.type === "textarea" ? (
                                      <textarea className="input min-h-24 resize-y" maxLength={2000} placeholder={f.placeholder} value={p.extra[f.key] ?? ""}
                                        onChange={(ev) => update(i, { extra: { ...p.extra, [f.key]: ev.target.value } })} />
                                    ) : (
                                      <input className="input" maxLength={2000} placeholder={f.placeholder} value={p.extra[f.key] ?? ""}
                                        onChange={(ev) => update(i, { extra: { ...p.extra, [f.key]: ev.target.value } })} />
                                    )}
                                  </Field>
                                ))}
                              </Group>

                              <Group title="Moyens & calendrier" hint="Facultatif">
                                <div>
                                  <span className="label">Budget estimatif</span>
                                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {([["unspecified", "Non renseigné"], ["none", "Sans budget"], ["unknown", "Je ne sais pas"], ["amount", "Montant estimé"]] as const).map(([v, l]) => (
                                      <button key={v} type="button" onClick={() => update(i, { budgetType: v })} aria-pressed={p.budgetType === v}
                                        className={`rounded-2xl border px-3 py-2.5 text-[13px] font-semibold transition ${p.budgetType === v ? "border-navy-900 bg-navy-900 text-white" : "border-navy-900/12 bg-white text-navy-900 hover:border-navy-900/40"}`}>{l}</button>
                                    ))}
                                  </div>
                                  <AnimatePresence initial={false}>
                                    {p.budgetType === "amount" && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="relative mt-3">
                                          <input className={`input pr-20 ${e.budgetAmount ? "input-error" : ""}`} maxLength={120} inputMode="text" value={p.budgetAmount}
                                            placeholder="Ex. 150 000 ou 1 000 / personne" onChange={(ev) => update(i, { budgetAmount: ev.target.value })} />
                                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">FCFA</span>
                                        </div>
                                        {e.budgetAmount && <FieldError msg={e.budgetAmount} />}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                                <Field label="Période souhaitée">
                                  <input className="input" maxLength={160} value={p.period} placeholder="Ex. Janvier, avant les soutenances…" onChange={(ev) => update(i, { period: ev.target.value })} />
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {PERIODS.map((s) => (
                                      <button key={s} type="button" onClick={() => update(i, { period: s })}
                                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${p.period === s ? "bg-gold-400 text-navy-950" : "bg-sky-100 text-navy-700 hover:bg-sky-200"}`}>{s}</button>
                                    ))}
                                  </div>
                                </Field>
                              </Group>

                              <Group title="Pour toute la promo">
                                <Field label="Accessibilité et inclusion" hint="Comment rendre cette proposition accessible à tous (coût, horaires, lieu, situation de chacun) ?">
                                  <textarea className="input min-h-24 resize-y" maxLength={2000} value={p.inclusion} onChange={(ev) => update(i, { inclusion: ev.target.value })} />
                                </Field>
                              </Group>

                              <div className="rounded-3xl border border-gold-400/40 bg-gradient-to-br from-[#FFF9EA] to-[#FBF1D6] p-5 sm:p-6">
                                <div className="flex items-center gap-2">
                                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-400 text-navy-950"><NotebookPen className="h-4 w-4" /></span>
                                  <span className="font-display text-lg font-semibold text-navy-900">Note spéciale</span>
                                </div>
                                <p className="mt-1.5 text-sm text-[#7A6326]">Une remarque, une précision, une préoccupation ou une idée qui n&apos;entre dans aucune case ? C&apos;est ici.</p>
                                <textarea className="input mt-3 min-h-24 resize-y !border-gold-400/40 !bg-white/80 focus:!ring-gold-400/20" maxLength={3000}
                                  value={p.specialNote} onChange={(ev) => update(i, { specialNote: ev.target.value })} placeholder="Écris librement…" />
                              </div>

                              <div className="flex flex-wrap justify-end gap-2 border-t border-navy-900/[0.06] pt-5">
                                <button type="button" onClick={() => duplicate(i)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-sky-100 hover:text-navy-900"><Copy className="h-4 w-4" /> Dupliquer</button>
                                <button type="button" onClick={() => remove(i)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /> {proposals.length === 1 ? "Vider" : "Supprimer"}</button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
              {proposals.length < 10 ? (
                <button type="button" onClick={addProposal}
                  className="group mt-4 flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-navy-900/15 bg-white/50 py-5 font-semibold text-navy-900 transition hover:border-navy-900/40 hover:bg-white">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gold-400 text-navy-950 transition group-hover:rotate-90"><Plus className="h-4 w-4" /></span>
                  Ajouter une autre proposition
                </button>
              ) : <p className="mt-4 text-center text-sm text-muted">10 propositions maximum par envoi — tu pourras en envoyer d&apos;autres ensuite.</p>}
              <NavButtons onBack={() => { setStep(0); scrollTop(); }} onNext={goNext} nextLabel="Relire avant d'envoyer" />
            </motion.section>
          ) : (
            <motion.section key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35 }}>
              <StepTitle n={3} title="Dernière relecture" sub="Vérifie que tout est bon. Tu peux encore modifier chaque proposition." />
              <div className="card divide-y divide-navy-900/[0.06]">
                <div className="flex items-center justify-between gap-4 p-5 sm:px-7">
                  <div>
                    <p className="eyebrow text-muted">Contribution de</p>
                    <p className="mt-1 font-semibold text-navy-900">{identity.anonymous ? "Anonyme" : identity.fullName}{identity.department && <span className="font-normal text-muted"> · {identity.department}</span>}</p>
                  </div>
                  <button onClick={() => setStep(0)} className="text-sm font-semibold text-navy-700 hover:underline">Modifier</button>
                </div>
                {proposals.map((p, i) => (
                  <div key={p.uid} className="p-5 sm:px-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gold-600">{categoryLabel.get(p.categoryId)}</p>
                        <h3 className="mt-1 font-display text-xl font-semibold text-navy-900">{i + 1}. {p.title}</h3>
                      </div>
                      <button onClick={() => { setStep(1); setOpen(i); }} className="shrink-0 text-sm font-semibold text-navy-700 hover:underline">Modifier</button>
                    </div>
                    <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-muted">{p.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {p.budgetType !== "unspecified" && <Tag>{p.budgetType === "none" ? "Sans budget" : p.budgetType === "unknown" ? "Budget : je ne sais pas" : `Budget : ${p.budgetAmount} FCFA`}</Tag>}
                      {p.period && <Tag>{p.period}</Tag>}
                      {p.specialNote.trim() && <Tag gold>Note spéciale</Tag>}
                    </div>
                  </div>
                ))}
              </div>
              {status === "error" && (
                <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> <span>{serverError} Tes réponses sont conservées : tu peux réessayer.</span>
                </div>
              )}
              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button onClick={() => { setStep(1); scrollTop(); }} className="btn-ghost"><ArrowLeft className="h-4 w-4" /> Retour</button>
                <button onClick={submit} disabled={status === "submitting"} className="btn-gold !px-8 !py-4 !text-base">
                  {status === "submitting" ? <><Loader2 className="h-5 w-5 animate-spin" /> Envoi en cours…</> : <>Envoyer ma contribution <Send className="h-4 w-4" /></>}
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function StepTitle({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="mb-6">
      <p className="eyebrow text-gold-600">Étape {n} sur 3</p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">{title}</h2>
      <p className="mt-2 text-muted">{sub}</p>
    </div>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 flex items-baseline gap-2">
        <span className="eyebrow text-navy-700">{title}</span>
        {hint && <span className="text-xs text-muted">· {hint}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({ label, hint, required, error, counter, children }: { label: string; hint?: string; required?: boolean; error?: string; counter?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label">{label} {required && <span className="text-gold-600">*</span>}</span>
        {counter && <span className="text-[11px] text-muted/70">{counter}</span>}
      </div>
      {hint && <p className="-mt-0.5 mb-2 text-xs text-muted">{hint}</p>}
      {children}
      {error && <FieldError msg={error} />}
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600"><CircleAlert className="h-3.5 w-3.5" />{msg}</p>;
}

function Tag({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 font-medium ${gold ? "bg-gold-300/40 text-[#7A6326]" : "bg-sky-100 text-navy-700"}`}>{children}</span>;
}

function NavButtons({ onBack, onNext, nextLabel }: { onBack?: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className={`mt-8 flex flex-col-reverse gap-3 sm:flex-row ${onBack ? "sm:justify-between" : "sm:justify-end"}`}>
      {onBack && <button onClick={onBack} className="btn-ghost"><ArrowLeft className="h-4 w-4" /> Retour</button>}
      <button onClick={onNext} className="btn-navy !px-7 !py-3.5">{nextLabel} <ArrowRight className="h-4 w-4" /></button>
    </div>
  );
}
