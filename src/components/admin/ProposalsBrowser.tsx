"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, ChevronDown, CircleAlert, EyeOff, Loader2, NotebookPen, Search, UserRound } from "lucide-react";
import type { Commission, ProposalRow } from "@/lib/types";
import { authorLabel, formatDate } from "@/lib/format";
import ExportButtons from "./ExportButtons";

export default function ProposalsBrowser({ commissions, initialCommission }: { commissions: Commission[]; initialCommission: string }) {
  const [commission, setCommission] = useState(initialCommission);
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [identity, setIdentity] = useState<"all" | "anonymous" | "identified">("all");
  const [rows, setRows] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => { const t = setTimeout(() => setDebounced(q), 300); return () => clearTimeout(t); }, [q]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true); setError("");
    const params = new URLSearchParams({ sort, identity });
    if (commission) params.set("commission", commission);
    if (commission && category) params.set("category", category);
    if (debounced.trim()) params.set("q", debounced.trim());
    fetch(`/api/admin/proposals?${params}`, { signal: ctrl.signal })
      .then(async (r) => { if (r.status === 401) { window.location.href = "/admin/login"; return; } if (!r.ok) throw new Error(); setRows((await r.json()).rows); })
      .catch((e) => { if (e.name !== "AbortError") setError("Impossible de charger les propositions."); })
      .finally(() => setLoading(false));
    const url = new URL(window.location.href);
    if (commission) url.searchParams.set("commission", commission); else url.searchParams.delete("commission");
    window.history.replaceState(null, "", url);
    return () => ctrl.abort();
  }, [commission, category, debounced, sort, identity]);

  const byslug = useMemo(() => new Map(commissions.map((c) => [c.slug, c])), [commissions]);
  const current = commission ? byslug.get(commission) : undefined;
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-gold-600">Propositions</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-navy-900">{current ? current.name : "Toutes les commissions"}</h1>
        </div>
        <ExportButtons scope={commission || "all"} label={commission ? "Télécharger les propositions" : "Tout exporter"} />
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {[{ slug: "", shortName: "Toutes" }, ...commissions].map((c) => (
          <button key={c.slug} onClick={() => { setCommission(c.slug); setCategory(""); }}
            className={`chip shrink-0 ${commission === c.slug ? "border-navy-900 bg-navy-900 text-white" : "border-navy-900/10 bg-white text-navy-900 hover:border-navy-900/40"}`}>
            {c.shortName}
          </button>
        ))}
      </div>

      {current && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[{ id: "", label: "Tous les thèmes" }, ...current.categories].map((t) => (
            <button key={t.id} onClick={() => setCategory(t.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${category === t.id ? "bg-gold-400 text-navy-950" : "bg-white text-navy-700 hover:bg-sky-100"}`}>{t.label}</button>
          ))}
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input !bg-white pl-11" placeholder="Rechercher un nom, un titre, un mot-clé…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input !bg-white sm:w-48" value={identity} onChange={(e) => setIdentity(e.target.value as typeof identity)}>
          <option value="all">Tous les auteurs</option>
          <option value="identified">Identifiés</option>
          <option value="anonymous">Anonymes</option>
        </select>
        <button onClick={() => setSort(sort === "desc" ? "asc" : "desc")} className="btn-ghost !rounded-2xl">
          <ArrowDownUp className="h-4 w-4" /> {sort === "desc" ? "Plus récentes" : "Plus anciennes"}
        </button>
      </div>

      <p className="mt-5 text-sm text-muted">
        {loading ? "Chargement…" : `${rows.length} proposition${rows.length > 1 ? "s" : ""}`}
        {!loading && rows.length > 0 && <button className="ml-3 font-semibold text-navy-700 hover:underline" onClick={() => setOpen(open.size ? new Set() : new Set(rows.map((r) => r.id)))}>{open.size ? "Tout replier" : "Tout déplier"}</button>}
      </p>

      {error && <p className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"><CircleAlert className="h-4 w-4" /> {error}</p>}

      <div className={`mt-4 space-y-3 transition-opacity ${loading ? "opacity-50" : ""}`}>
        {loading && rows.length === 0 && <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-navy-700" /></div>}
        {!loading && !error && rows.length === 0 && (
          <div className="card p-12 text-center text-muted">Aucune proposition ne correspond à ces critères.</div>
        )}
        {rows.map((p) => {
          const c = byslug.get(p.commissionSlug);
          const isOpen = open.has(p.id);
          const extraLabels = new Map((c?.extraFields ?? []).map((f) => [f.key, f.label]));
          return (
            <article key={p.id} className="card overflow-hidden">
              <button onClick={() => toggle(p.id)} className="flex w-full items-start gap-4 p-5 text-left sm:px-6" aria-expanded={isOpen}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gold-600">{!commission && `${c?.shortName ?? p.commissionSlug} · `}{p.categoryLabel}</p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-navy-900">{p.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${p.isAnonymous ? "bg-navy-900/[0.06] text-muted" : "bg-sky-100 text-navy-800"}`}>
                      {p.isAnonymous ? <EyeOff className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}{authorLabel(p)}
                    </span>
                    {p.department && <span className="text-muted">{p.department}</span>}
                    <span className="text-muted">· {formatDate(p.createdAt)}</span>
                    {p.specialNote && <span className="inline-flex items-center gap-1 rounded-full bg-gold-300/40 px-2.5 py-1 font-medium text-[#7A6326]"><NotebookPen className="h-3 w-3" /> Note spéciale</span>}
                  </div>
                  {!isOpen && <p className="mt-2 line-clamp-2 text-sm text-muted">{p.description}</p>}
                </div>
                <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="space-y-4 border-t border-navy-900/[0.06] px-5 pb-6 pt-5 sm:px-6">
                  <Block k="Description détaillée" v={p.description} />
                  <Block k="Objectif" v={p.objective} />
                  <Block k="Organisation proposée" v={p.organization} />
                  {Object.entries(p.extra).map(([k, v]) => <Block key={k} k={extraLabels.get(k) ?? k} v={v} />)}
                  <Block k="Accessibilité et inclusion" v={p.inclusion} />
                  {p.specialNote && (
                    <div className="rounded-2xl border-l-4 border-gold-400 bg-[#FFF8E6] px-5 py-4">
                      <p className="eyebrow text-gold-600">Note spéciale</p>
                      <p className="mt-1.5 whitespace-pre-line text-sm italic leading-relaxed text-[#4A3D1A]">{p.specialNote}</p>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Block({ k, v }: { k: string; v?: string | null }) {
  if (!v) return null;
  return <div><p className="text-[11px] font-bold uppercase tracking-wider text-navy-700">{k}</p><p className="mt-1 whitespace-pre-line text-[14.5px] leading-relaxed text-ink">{v}</p></div>;
}
