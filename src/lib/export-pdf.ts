import "server-only";
import PDFDocument from "pdfkit";
import type { Commission, ProposalRow } from "./types";
import { authorLabel, formatDate } from "./format";

const NAVY = "#0B2545";
const BLUE = "#1D4E89";
const GOLD = "#B8902E";
const MUTED = "#5B6B82";

// Les polices PDF standard (Helvetica) couvrent le jeu WinAnsi : on remplace le reste (emojis…).
const WIN_ANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
function safe(text: string) {
  return Array.from(text).map((ch) => {
    const code = ch.codePointAt(0)!;
    if (code === 10 || code === 13 || (code >= 32 && code <= 126) || (code >= 160 && code <= 255) || WIN_ANSI_EXTRA.includes(ch)) return ch;
    if (ch === " " || ch === " ") return " ";
    return "";
  }).join("");
}

export async function buildPdf(opts: { commissions: Commission[]; rows: ProposalRow[]; scope: "all" | string }): Promise<Buffer> {
  const { commissions, rows, scope } = opts;
  const targets = scope === "all" ? commissions : commissions.filter((c) => c.slug === scope);
  const title = scope === "all" ? "Synthèse de toutes les commissions" : targets[0]?.name ?? scope;

  const doc = new PDFDocument({ size: "A4", margins: { top: 64, bottom: 64, left: 60, right: 60 }, bufferPages: true,
    info: { Title: `COM5 – ${title}`, Author: "COM5 – EPT" } });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((res) => doc.on("end", () => res(Buffer.concat(chunks))));
  const W = doc.page.width - 120;

  const ensure = (h: number) => { if (doc.y + h > doc.page.height - 80) doc.addPage(); };
  const label = (t: string) => { ensure(40); doc.moveDown(0.5).font("Helvetica-Bold").fontSize(8).fillColor(BLUE).text(safe(t.toUpperCase()), { characterSpacing: 0.8 }); };
  const body = (t: string) => { doc.moveDown(0.15).font("Helvetica").fontSize(10.5).fillColor("#1B2333").text(safe(t), { lineGap: 2.5 }); };
  const field = (l: string, v?: string | null) => { if (v && v.trim()) { label(l); body(v); } };

  // Couverture
  doc.rect(0, 0, doc.page.width, 8).fill(NAVY);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(GOLD).text("ÉCOLE POLYTECHNIQUE DE THIÈS", 60, 64, { characterSpacing: 1.5 });
  doc.moveDown(0.4).font("Helvetica-Bold").fontSize(24).fillColor(NAVY).text("COM5 – Feuille de route participative");
  doc.moveDown(0.2).font("Helvetica").fontSize(15).fillColor(BLUE).text(safe(title));
  doc.moveDown(0.3).fontSize(10).fillColor(MUTED).text(safe(`Exporté le ${formatDate(new Date())} · ${rows.length} proposition${rows.length > 1 ? "s" : ""}`));
  doc.moveDown(0.6); doc.moveTo(60, doc.y).lineTo(60 + W, doc.y).lineWidth(1.5).strokeColor(GOLD).stroke(); doc.moveDown(1);

  targets.forEach((c, ci) => {
    const list = rows.filter((r) => r.commissionSlug === c.slug);
    if (ci > 0 || scope === "all") { if (ci > 0) doc.addPage(); }
    doc.font("Helvetica-Bold").fontSize(18).fillColor(NAVY).text(safe(c.name));
    doc.moveDown(0.2).font("Helvetica-Oblique").fontSize(9.5).fillColor(MUTED).text(safe(c.description), { lineGap: 2 });
    doc.moveDown(0.4).font("Helvetica-Bold").fontSize(10).fillColor(BLUE).text(`${list.length} proposition${list.length > 1 ? "s" : ""}`);
    if (!list.length) { doc.moveDown(0.5).font("Helvetica-Oblique").fillColor(MUTED).text("Aucune proposition reçue pour le moment."); return; }

    list.forEach((p, i) => {
      ensure(140);
      doc.moveDown(1);
      const y = doc.y;
      doc.moveTo(60, y).lineTo(60 + W, y).lineWidth(0.6).strokeColor("#D6DEEA").stroke();
      doc.moveDown(0.5).font("Helvetica-Bold").fontSize(13).fillColor(GOLD).text(`${i + 1}. `, { continued: true }).fillColor(NAVY).text(safe(p.title));
      doc.moveDown(0.25).font("Helvetica").fontSize(8.5).fillColor(MUTED).text(safe(
        `${p.categoryLabel}  ·  ${authorLabel(p)}${p.department ? " · " + p.department : ""}  ·  ${formatDate(p.createdAt)}`));
      field("Description détaillée", p.description);
      field("Objectif", p.objective);
      field("Organisation proposée", p.organization);
      const extraLabels = new Map(c.extraFields.map((f) => [f.key, f.label]));
      Object.entries(p.extra || {}).forEach(([k, v]) => field(extraLabels.get(k) ?? k, v));
      field("Accessibilité et inclusion", p.inclusion);
      if (p.specialNote?.trim()) {
        ensure(60);
        doc.moveDown(0.6);
        const text = safe(p.specialNote);
        doc.font("Helvetica-Oblique").fontSize(10);
        const h = doc.heightOfString(text, { width: W - 24, lineGap: 2 }) + 30;
        const top = doc.y;
        doc.rect(60, top, W, h).fill("#FBF4E2");
        doc.rect(60, top, 3, h).fill(GOLD);
        doc.font("Helvetica-Bold").fontSize(8).fillColor(GOLD).text("NOTE SPÉCIALE", 74, top + 8, { characterSpacing: 0.8 });
        doc.font("Helvetica-Oblique").fontSize(10).fillColor("#3A3020").text(text, 74, top + 20, { width: W - 24, lineGap: 2 });
        doc.x = 60; doc.y = top + h;
      }
    });
  });

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.font("Helvetica").fontSize(8).fillColor(MUTED)
      .text(`COM5 · Ton avis aussi compte !   —   Page ${i + 1} / ${range.count}`, 60, doc.page.height - 40, { width: W, align: "center" });
    doc.page.margins.bottom = bottom;
  }
  doc.end();
  return done;
}
