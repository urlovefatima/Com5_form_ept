"use client";

import { useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import type { Commission } from "@/lib/types";

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "categorie";

export default function CommissionsEditor({ initial, initialDepartments }: { initial: Commission[]; initialDepartments: string[] }) {
  const [list, setList] = useState(initial);
  const [sel, setSel] = useState(initial[0]?.slug);
  const [state, setState] = useState<{ busy: boolean; msg: string; ok: boolean }>({ busy: false, msg: "", ok: true });
  const [depts, setDepts] = useState(initialDepartments.join("\n"));
  const [deptMsg, setDeptMsg] = useState("");
  const c = list.find((x) => x.slug === sel)!;
  const set = (patch: Partial<Commission>) => setList((l) => l.map((x) => (x.slug === sel ? { ...x, ...patch } : x)));

  const save = async () => {
    setState({ busy: true, msg: "", ok: true });
    const res = await fetch("/api/admin/commissions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) });
    const d = await res.json().catch(() => ({}));
    setState({ busy: false, ok: res.ok, msg: res.ok ? "Enregistré — visible immédiatement sur le site." : d.error || "Erreur" });
  };
  const saveDepts = async () => {
    const res = await fetch("/api/admin/departments", { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departments: depts.split("\n").map((s) => s.trim()).filter(Boolean) }) });
    setDeptMsg(res.ok ? "Liste enregistrée." : "Erreur d'enregistrement.");
  };

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow text-gold-600">Configuration</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-navy-900">Commissions</h1>
      <p className="mt-1 text-muted">Modifie les textes, images et catégories sans redéployer le site. Les propositions déjà reçues gardent leur libellé d&apos;origine.</p>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {list.map((x) => (
          <button key={x.slug} onClick={() => { setSel(x.slug); setState({ busy: false, msg: "", ok: true }); }}
            className={`chip shrink-0 ${sel === x.slug ? "border-navy-900 bg-navy-900 text-white" : "border-navy-900/10 bg-white text-navy-900"}`}>{x.shortName}</button>
        ))}
      </div>

      {c && (
        <div className="card mt-4 space-y-5 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <L t="Nom complet"><input className="input" value={c.name} onChange={(e) => set({ name: e.target.value })} /></L>
            <L t="Nom court"><input className="input" value={c.shortName} onChange={(e) => set({ shortName: e.target.value })} /></L>
            <L t="Accroche"><input className="input" value={c.tagline} onChange={(e) => set({ tagline: e.target.value })} /></L>
            <L t="Ordre d'affichage"><input type="number" className="input" value={c.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) })} /></L>
          </div>
          <L t="Description de la mission"><textarea className="input min-h-24" value={c.description} onChange={(e) => set({ description: e.target.value })} /></L>
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <div className="space-y-4">
              <L t="Image (chemin /images/… ou URL https)"><input className="input" value={c.image} onChange={(e) => set({ image: e.target.value })} /></L>
              <L t="Texte alternatif de l'image"><input className="input" value={c.imageAlt} onChange={(e) => set({ imageAlt: e.target.value })} /></L>
            </div>
            {c.image && <img src={c.image} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />}
          </div>

          <div>
            <p className="label">Thèmes proposés aux étudiants</p>
            <div className="space-y-2">
              {c.categories.map((cat, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input" value={cat.label} onChange={(e) => set({ categories: c.categories.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                  <button onClick={() => set({ categories: c.categories.filter((_, j) => j !== i) })} className="rounded-2xl px-3 text-muted hover:bg-red-50 hover:text-red-600" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <button onClick={() => {
              const label = "Nouveau thème"; let id = slugify(label); let n = 2;
              while (c.categories.some((x) => x.id === id)) id = `${slugify(label)}-${n++}`;
              set({ categories: [...c.categories, { id, label }] });
            }} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:underline"><Plus className="h-4 w-4" /> Ajouter un thème</button>
          </div>


          <div className="flex flex-wrap items-center gap-4 border-t border-navy-900/[0.06] pt-5">
            <button onClick={save} disabled={state.busy} className="btn-navy">{state.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Enregistrer</button>
            {state.msg && <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.msg}</p>}
          </div>
        </div>
      )}

      <div className="card mt-8 p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-navy-900">Génies / départements proposés</h2>
        <p className="mt-1 text-sm text-muted">Un par ligne.</p>
        <textarea className="input mt-3 min-h-36" value={depts} onChange={(e) => setDepts(e.target.value)} />
        <div className="mt-3 flex items-center gap-4"><button onClick={saveDepts} className="btn-navy">Enregistrer la liste</button>{deptMsg && <span className="text-sm text-muted">{deptMsg}</span>}</div>
      </div>
    </div>
  );
}

function L({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="block"><span className="label">{t}</span>{children}</label>;
}
