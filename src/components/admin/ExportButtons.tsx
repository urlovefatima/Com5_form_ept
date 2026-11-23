"use client";
import { useState } from "react";
import { FileDown, FileText, Loader2 } from "lucide-react";

export default function ExportButtons({ scope, compact = false, label = "Télécharger les propositions" }: { scope: string; compact?: boolean; label?: string }) {
  const [busy, setBusy] = useState<"" | "docx" | "pdf">("");
  const [err, setErr] = useState("");
  const dl = async (format: "docx" | "pdf") => {
    setBusy(format); setErr("");
    try {
      const res = await fetch(`/api/admin/export?scope=${encodeURIComponent(scope)}&format=${format}`);
      if (!res.ok) throw new Error(res.status === 401 ? "Session expirée, reconnecte-toi." : "Échec de l'export.");
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") || "")?.[1] || `COM5.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) { setErr(e instanceof Error ? e.message : "Échec de l'export."); }
    finally { setBusy(""); }
  };
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => dl("docx")} disabled={!!busy} className={compact ? "btn-navy !px-4 !py-2 !text-xs" : "btn-navy"}>
          {busy === "docx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} {label} (.docx)
        </button>
        <button onClick={() => dl("pdf")} disabled={!!busy} className={compact ? "btn-ghost !px-4 !py-2 !text-xs" : "btn-ghost"}>
          {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} PDF
        </button>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
