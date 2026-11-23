import { getAdmin } from "@/lib/auth";
import { getCommissions } from "@/lib/commissions";
import { listProposals } from "@/lib/queries";
import { buildDocx } from "@/lib/export-docx";
import { buildPdf } from "@/lib/export-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!(await getAdmin())) return new Response("Non autorisé", { status: 401 });
  const u = new URL(req.url);
  const scope = u.searchParams.get("scope") || "all";
  const format = u.searchParams.get("format") === "pdf" ? "pdf" : "docx";
  const commissions = await getCommissions();
  if (scope !== "all" && !commissions.some((c) => c.slug === scope)) return new Response("Commission inconnue", { status: 404 });

  const rows = await listProposals({ commission: scope === "all" ? undefined : scope, sort: "asc" });
  const date = new Date().toISOString().slice(0, 10);
  const base = scope === "all" ? "COM5_toutes-commissions" : `COM5_${scope}`;

  if (format === "pdf") {
    const buf = await buildPdf({ commissions, rows, scope });
    return new Response(new Uint8Array(buf), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${base}_${date}.pdf"`, "Cache-Control": "no-store" } });
  }
  const buf = await buildDocx({ commissions, rows, scope });
  return new Response(new Uint8Array(buf), { headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Disposition": `attachment; filename="${base}_${date}.docx"`, "Cache-Control": "no-store" } });
}
