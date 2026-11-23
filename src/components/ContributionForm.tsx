"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, CircleAlert, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { Commission } from "@/lib/types";

type Proposal = { uid: string; categoryId: string; title: string; description: string; specialNote: string };
type Errors = Partial<Record<"categoryId" | "title" | "description", string>>;

const uid = () => Math.random().toString(36).slice(2, 10);
const emptyProposal = (): Proposal => ({ uid: uid(), categoryId: "", title: "", description: "", specialNote: "" });

function validate(p: Proposal): Errors {
  const e: Errors = {};
  if (!p.categoryId) e.categoryId = "Choisis un thème.";
  if (p.title.trim().length < 3) e.title = "Donne un titre à ton idée (3 caractères min.).";
  if (p.description.trim().length < 10) e.description = "Décris ton idée en quelques mots (10 caractères min.).";
  return e;
}

export default function ContributionForm({
  commission, departments, others,
}: { commission: Commission; departments: string[]; others: { slug: string; shortName: string }[] }) {
  const storageKey = `com5:draft2:${commission.slug}`;
  const [proposals, setProposals] = useState<Proposal[]>([emptyProposal()]);
  const [active, setActive] = useState(0);
  const [errors, setErrors] = useState<Record<string, Errors>>({});
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [website, setWebsite] = useState(""); // champ piège anti-robots
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [sent, setSent] = useState(0);
  const startedAt = useRef(Date.now());
  const topRef = useRef<HTMLDivElement>(null);
  const labels = useMemo(() => new Map(commission.categories.map((c) => [c.id, c.label])), [commission.categories]);

  // Brouillon local (confort) — la vraie sauvegarde se fait en base à l'envoi.
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (d?.proposals?.length) {
        setProposals(d.proposals.map((p: Proposal) => ({ ...emptyProposal(), ...p })));
        setActive(Math.min(d.active ?? 0, d.proposals.length - 1));
        setFullName(d.fullName ?? ""); setDepartment(d.department ?? "");
      }
    } catch {}
    setLoaded(true);
  }, [storageKey]);
  useEffect(() => {
    if (!loaded || status === "success") return;
    try { localStorage.setItem(storageKey, JSON.stringify({ proposals, active, fullName, department })); } catch {}
  }, [proposals, active, fullName, department, loaded, status, storageKey]);

  const update = (i: number, patch: Partial<Proposal>) => {
    setProposals((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));
    const id = proposals[i].uid;
    if (errors[id]) setErrors((e) => { const cur = { ...e[id] }; Object.keys(patch).forEach((k) => delete cur[k as keyof Errors]); return { ...e, [id]: cur }; });
  };

  const checkAll = () => {
    const all: Record<string, Errors> = {}; let bad = -1;
    proposals.forEach((p, i) => { const e = validate(p); if (Object.keys(e).length) { all[p.uid] = e; if (bad < 0) bad = i; } });
    setErrors(all);
    if (bad >= 0) { setActive(bad); setTimeout(() => document.getElementById(`p-${proposals[bad].uid}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60); }
    return bad < 0;
  };

  const add = () => {
    if (!checkAll()) return;
    setProposals((ps) => [...ps, emptyProposal()]);
    setActive(proposals.length);
  };
  const remove = (i: number) => {
    setProposals((ps) => (ps.length === 1 ? [emptyProposal()] : ps.filter((_, j) => j !== i)));
    setActive((a) => Math.max(0, Math.min(a, proposals.length - 2)));
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!checkAll()) return;
    setStatus("submitting"); setServerError("");
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionSlug: commission.slug,
          anonymous: fullName.trim().length < 2,
          fullName: fullName.trim(),
          department,
          proposals: proposals.map((p) => ({ categoryId: p.categoryId, title: p.title, description: p.description, specialNote: p.specialNote })),
          website,
          startedAt: startedAt.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "L'envoi a échoué. Réessaie dans un instant.");
      setSent(proposals.length); setStatus("success");
      try { localStorage.removeItem(storageKey); } catch {}
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setStatus("error"); setServerError(err instanceof Error ? err.message : "L'envoi a échoué.");
    }
  };

  const restart = () => {
    setProposals([emptyProposal()]); setActive(0); setErrors({}); setStatus("idle"); startedAt.current = Date.now();
  };

  return (
    <main ref={topRef} className="min-h-screen bg-white">
      {/* Barre du haut */}
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-6">
        <Link href="/#commissions" className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-sky-200">
          <ArrowLeft className="h-4 w-4" /> Commissions
        </Link>
        <span className="hidden text-sm text-muted sm:block">COM5 · <span className="font-semibold text-navy-900">Ton avis aussi compte !</span></span>
        <Link href="/" aria-label="Accueil" className="grid h-10 w-10 place-items-center rounded-full bg-navy-950"><img src="/images/emblem-ept.png" alt="" className="h-4" /></Link>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-8">
        {/* Titre */}
        <div className="mt-4 flex flex-col gap-4 sm:mt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-navy-800">{commission.name}</span>
            <h1 className="mt-4 text-[2.6rem] font-extrabold leading-[1] tracking-[-0.04em] text-navy-950 sm:text-6xl lg:text-7xl">
              {status === "success" ? "Merci !" : <>Partage ton <span className="font-display font-medium italic text-navy-700">idée</span></>}
            </h1>
          </div>
          <p className="line-clamp-3 max-w-sm text-[15px] leading-relaxed text-muted sm:line-clamp-none lg:text-right">{commission.description}</p>
        </div>

        <div className="mt-8 grid gap-4 lg:mt-12 lg:grid-cols-[1.4fr_1fr] lg:gap-5">
          {/* Formulaire */}
          <div className="order-2 lg:order-1">
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div key="ok" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] bg-sky-50 p-6 sm:p-10">
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
                    className="grid h-16 w-16 place-items-center rounded-full bg-navy-900 text-gold-300"><Check className="h-8 w-8" strokeWidth={2.6} /></motion.span>
                  <h2 className="mt-6 text-3xl font-extrabold tracking-[-0.03em] text-navy-950">C&apos;est bien reçu.</h2>
                  <p className="mt-2 max-w-md leading-relaxed text-muted">
                    {sent > 1 ? `Tes ${sent} idées ont été transmises` : "Ton idée a été transmise"} à la COM5 ({commission.shortName}). Merci de construire la feuille de route avec nous.
                  </p>
                  <p className="mt-8 text-sm font-semibold text-navy-900">Une idée pour une autre commission ?</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {others.map((o) => (
                      <Link key={o.slug} href={`/contribuer/${o.slug}`} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-navy-900 hover:text-white">
                        {o.shortName} <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    ))}
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button onClick={restart} className="rounded-full bg-navy-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy-800">Proposer autre chose ici</button>
                    <Link href="/" className="rounded-full px-6 py-3 text-sm font-semibold text-navy-900 ring-1 ring-navy-900/15 transition hover:ring-navy-900/40">Accueil</Link>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[1.75rem] bg-sky-50 p-4 sm:p-8">
                  <div className="space-y-3">
                    {proposals.map((p, i) => {
                      const e = errors[p.uid] || {};
                      const bad = Object.keys(e).length > 0;
                      if (i !== active) {
                        return (
                          <div key={p.uid} id={`p-${p.uid}`} className={`flex items-center gap-3 rounded-2xl bg-white p-3 pl-4 ${bad ? "ring-2 ring-red-300" : ""}`}>
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-100 text-sm font-bold text-navy-900">{i + 1}</span>
                            <button type="button" onClick={() => setActive(i)} className="min-w-0 flex-1 text-left">
                              <span className="block truncate text-[15px] font-semibold text-navy-900">{p.title || "Idée sans titre"}</span>
                              <span className="block truncate text-xs text-muted">{labels.get(p.categoryId) ?? "Thème à choisir"}</span>
                            </button>
                            {bad && <CircleAlert className="h-4 w-4 shrink-0 text-red-500" />}
                            <button type="button" onClick={() => setActive(i)} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-sky-100 hover:text-navy-900" aria-label="Modifier"><Pencil className="h-4 w-4" /></button>
                            <button type="button" onClick={() => remove(i)} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-red-50 hover:text-red-600" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        );
                      }
                      const done = [!!p.categoryId, p.title.trim().length >= 3, p.description.trim().length >= 10];
                      return (
                        <motion.div key={p.uid} id={`p-${p.uid}`} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="scroll-mt-4 space-y-6">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-navy-900">{proposals.length > 1 ? `Idée n°${i + 1}` : "Ton idée"}</p>
                            <div className="flex items-center gap-1.5" aria-hidden="true">
                              {["Thème", "Titre", "Idée"].map((s, k) => (
                                <span key={s} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${done[k] ? "bg-navy-900 text-white" : "bg-white text-muted"}`}>{s}</span>
                              ))}
                            </div>
                          </div>

                          <Step n={1} label="Choisis un thème" error={e.categoryId}>
                            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Thème">
                              {commission.categories.map((c) => {
                                const sel = p.categoryId === c.id;
                                return (
                                  <button key={c.id} type="button" role="radio" aria-checked={sel} onClick={() => update(i, { categoryId: c.id })}
                                    className={`rounded-full px-4 py-2.5 text-[13.5px] font-medium transition-all duration-200 ${sel ? "bg-navy-900 text-white shadow-md" : "bg-white text-navy-900 hover:bg-sky-200/70"}`}>
                                    {sel && <Check className="-ml-0.5 mr-1.5 inline h-3.5 w-3.5 text-gold-300" />}{c.label}
                                  </button>
                                );
                              })}
                            </div>
                          </Step>

                          <Step n={2} label="Quel est le titre de votre proposition ?" error={e.title} htmlFor={`t-${p.uid}`}>
                            <input id={`t-${p.uid}`} className={`field ${e.title ? "field-error" : ""}`} maxLength={160} value={p.title}
                              placeholder="Ex. Une journée d'intégration avec les filleuls" onChange={(ev) => update(i, { title: ev.target.value })} />
                          </Step>

                          <Step n={3} label="Expliquez-nous votre idée ! Comment aimeriez-vous voir cette initiative se réaliser ?" error={e.description} htmlFor={`d-${p.uid}`}>
                            <textarea id={`d-${p.uid}`} className={`field min-h-44 resize-y leading-relaxed ${e.description ? "field-error" : ""}`} maxLength={5000} value={p.description}
                              placeholder="Écris librement : ce que tu imagines, comment ça pourrait se passer…" onChange={(ev) => update(i, { description: ev.target.value })} />
                          </Step>

                          <div>
                            <label htmlFor={`n-${p.uid}`} className="mb-2 block text-sm font-semibold text-navy-900">Note spéciale <span className="font-normal text-muted">· facultatif</span></label>
                            <textarea id={`n-${p.uid}`} className="field min-h-20 resize-y" maxLength={3000} value={p.specialNote}
                              placeholder="Une remarque, une précision, une préoccupation…" onChange={(ev) => update(i, { specialNote: ev.target.value })} />
                          </div>

                          {proposals.length > 1 && (
                            <button type="button" onClick={() => remove(i)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-red-600"><Trash2 className="h-4 w-4" /> Retirer cette idée</button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {proposals.length < 10 && (
                    <button type="button" onClick={add}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy-900/15 py-4 text-sm font-semibold text-navy-900 transition hover:border-navy-900/40 hover:bg-white">
                      <Plus className="h-4 w-4" /> Ajouter une autre proposition
                    </button>
                  )}

                  {/* Infos facultatives */}
                  <div className="mt-7 border-t border-navy-900/10 pt-6">
                    <p className="text-sm font-semibold text-navy-900">Toi <span className="font-normal text-muted">· facultatif, laisse vide pour rester anonyme</span></p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input className="field" aria-label="Nom et prénom" placeholder="Nom et prénom" autoComplete="name" maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      <div className="relative">
                        <select className="field appearance-none pr-10" aria-label="Génie ou département" value={department} onChange={(e) => setDepartment(e.target.value)}>
                          <option value="">Génie / département</option>
                          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      </div>
                    </div>
                    <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                      <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                    </div>
                  </div>

                  {status === "error" && (
                    <p role="alert" className="mt-5 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{serverError} Tes réponses sont conservées.</p>
                  )}

                  <div className="mt-6 flex items-center gap-1.5">
                    <button disabled={status === "submitting"} className="rounded-full bg-navy-950 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60">
                      {status === "submitting" ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</span>
                        : proposals.length > 1 ? `Envoyer mes ${proposals.length} idées` : "Envoyer ma contribution"}
                    </button>
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-navy-950 text-white" aria-hidden="true"><ArrowUpRight className="h-5 w-5" /></span>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Visuel de la commission */}
          <aside className="order-1 lg:order-2">
            <div className="relative h-44 overflow-hidden rounded-[1.75rem] bg-navy-900 sm:h-64 lg:sticky lg:top-6 lg:h-[560px]">
              <img src={commission.image} alt={commission.imageAlt} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
              <span className="absolute right-4 top-4 rounded-full border border-white/50 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur">{commission.shortName}</span>
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur-md">
                <p className="text-[15px] font-semibold">{commission.tagline}</p>
                <p className="mt-0.5 text-xs text-white/70">{commission.categories.length} thèmes · 2 minutes · anonymat possible</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Step({ n, label, error, htmlFor, children }: { n: number; label: string; error?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2.5 flex items-start gap-2.5 text-[15px] font-semibold leading-snug text-navy-900">
        <span className="mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-900 text-[11px] font-bold text-white">{n}</span>
        {label}
      </label>
      {children}
      {error && <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600"><CircleAlert className="h-3.5 w-3.5" />{error}</p>}
    </div>
  );
}
