import "server-only";
import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, Packer, PageBreak, PageNumber,
  Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} from "docx";
import type { Commission, ProposalRow } from "./types";
import { authorLabel, formatDate } from "./format";

const NAVY = "0B2545";
const BLUE = "1D4E89";
const GOLD = "B8902E";
const MUTED = "5B6B82";
const FONT = "Calibri";

const run = (text: string, o: Partial<{ bold: boolean; color: string; size: number; italics: boolean }> = {}) =>
  new TextRun({ text, font: FONT, size: o.size ?? 22, bold: o.bold, color: o.color, italics: o.italics });

/** Gère les retours à la ligne saisis par l'étudiant. */
function multiline(text: string, o: Partial<{ color: string; size: number; italics: boolean }> = {}) {
  const lines = text.split(/\r?\n/);
  return lines.map((l, i) => new TextRun({ text: l, font: FONT, size: o.size ?? 22, color: o.color, italics: o.italics, break: i > 0 ? 1 : 0 }));
}

function field(label: string, value?: string | null) {
  if (!value || !value.trim()) return [];
  return [
    new Paragraph({ spacing: { before: 140, after: 40 }, children: [run(label.toUpperCase(), { bold: true, color: BLUE, size: 17 })] }),
    new Paragraph({ spacing: { after: 60, line: 300 }, children: multiline(value) }),
  ];
}

function metaTable(p: ProposalRow) {
  const cells: [string, string][] = [
    ["Thème", p.categoryLabel],
    ["Auteur", authorLabel(p) + (p.department ? ` · ${p.department}` : "")],
    ["Reçue le", formatDate(p.createdAt)],
  ];
  const border = { style: BorderStyle.SINGLE, size: 4, color: "D6DEEA" };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: cells.map(([k, v]) => new TableRow({
      children: [
        new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, color: "auto", fill: "EEF3FA" },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [run(k, { bold: true, color: NAVY, size: 19 })] })] }),
        new TableCell({ width: { size: 72, type: WidthType.PERCENTAGE }, margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [run(v, { size: 19 })] })] }),
      ],
    })),
  });
}

function specialNote(note: string) {
  return new Paragraph({
    spacing: { before: 160, after: 80, line: 300 },
    shading: { type: ShadingType.CLEAR, color: "auto", fill: "FBF4E2" },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: GOLD, space: 8 } },
    indent: { left: 120, right: 120 },
    children: [run("NOTE SPÉCIALE  ", { bold: true, color: GOLD, size: 17 }), new TextRun({ text: "", break: 1 }), ...multiline(note, { italics: true })],
  });
}

function proposalBlock(p: ProposalRow, index: number, c: Commission | undefined) {
  const extraLabels = new Map((c?.extraFields ?? []).map((f) => [f.key, f.label]));
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 360, after: 120 },
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: "D6DEEA", space: 10 } },
      children: [run(`${index}. `, { bold: true, color: GOLD, size: 28 }), run(p.title, { bold: true, color: NAVY, size: 28 })],
    }),
    metaTable(p),
    ...field("Description détaillée", p.description),
    ...field("Objectif", p.objective),
    ...field("Organisation proposée", p.organization),
    ...Object.entries(p.extra || {}).flatMap(([k, v]) => field(extraLabels.get(k) ?? k, v)),
    ...field("Accessibilité et inclusion", p.inclusion),
  ];
  if (p.specialNote?.trim()) children.push(specialNote(p.specialNote));
  return children;
}

function categorySummary(rows: ProposalRow[]) {
  const counts = new Map<string, number>();
  rows.forEach((r) => counts.set(r.categoryLabel, (counts.get(r.categoryLabel) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label, n]) =>
    new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [run(label + " : ", { color: NAVY }), run(`${n} proposition${n > 1 ? "s" : ""}`, { bold: true })] }));
}

function commissionSection(c: Commission | undefined, slug: string, rows: ProposalRow[], first: boolean) {
  const name = c?.name ?? slug;
  const contributions = new Set(rows.map((r) => r.submissionId)).size;
  const notes = rows.filter((r) => r.specialNote?.trim()).length;
  const out: (Paragraph | Table)[] = [];
  if (!first) out.push(new Paragraph({ children: [new PageBreak()] }));
  out.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 80 }, children: [run(name, { bold: true, color: NAVY, size: 40 })] }),
    new Paragraph({ spacing: { after: 200 }, children: [run(c?.description ?? "", { color: MUTED, italics: true, size: 20 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [
      run(`${rows.length} proposition${rows.length > 1 ? "s" : ""}`, { bold: true, color: BLUE }),
      run(`  ·  ${contributions} contribution${contributions > 1 ? "s" : ""}  ·  ${notes} note${notes > 1 ? "s" : ""} spéciale${notes > 1 ? "s" : ""}`, { color: MUTED }),
    ] }),
  );
  if (rows.length === 0) {
    out.push(new Paragraph({ children: [run("Aucune proposition reçue pour le moment.", { italics: true, color: MUTED })] }));
    return out;
  }
  out.push(new Paragraph({ spacing: { before: 120, after: 60 }, children: [run("Répartition par thème", { bold: true, color: NAVY })] }));
  out.push(...categorySummary(rows));
  rows.forEach((r, i) => out.push(...proposalBlock(r, i + 1, c)));
  return out;
}

export async function buildDocx(opts: { commissions: Commission[]; rows: ProposalRow[]; scope: "all" | string }) {
  const { commissions, rows, scope } = opts;
  const now = new Date();
  const targets = scope === "all" ? commissions : commissions.filter((c) => c.slug === scope);
  const title = scope === "all" ? "Synthèse de toutes les commissions" : targets[0]?.name ?? scope;

  const cover: Paragraph[] = [
    new Paragraph({ spacing: { after: 60 }, children: [run("ÉCOLE POLYTECHNIQUE DE THIÈS", { bold: true, color: GOLD, size: 18 })] }),
    new Paragraph({ spacing: { after: 40 }, children: [run("COM5 – Feuille de route participative", { bold: true, color: NAVY, size: 48 })] }),
    new Paragraph({ spacing: { after: 40 }, children: [run(title, { color: BLUE, size: 30 })] }),
    new Paragraph({ spacing: { after: 300 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 8 } },
      children: [run(`Document exporté le ${formatDate(now)} · ${rows.length} proposition${rows.length > 1 ? "s" : ""}`, { color: MUTED, size: 20 })] }),
  ];

  const body: (Paragraph | Table)[] = [];
  if (scope === "all") {
    body.push(new Paragraph({ spacing: { after: 80 }, children: [run("Sommaire", { bold: true, color: NAVY, size: 26 })] }));
    targets.forEach((c) => {
      const n = rows.filter((r) => r.commissionSlug === c.slug).length;
      body.push(new Paragraph({ bullet: { level: 0 }, children: [run(c.name + " — ", { color: NAVY }), run(`${n} proposition${n > 1 ? "s" : ""}`, { bold: true })] }));
    });
  }
  targets.forEach((c, i) => body.push(...commissionSection(c, c.slug, rows.filter((r) => r.commissionSlug === c.slug), scope !== "all" && i === 0)));

  const doc = new Document({
    creator: "COM5 – EPT",
    title: `COM5 – ${title}`,
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [run("COM5 · Ton avis aussi compte !", { color: MUTED, size: 16 })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ font: FONT, size: 16, color: MUTED, children: ["Page ", PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES] }),
      ] })] }) },
      children: [...cover, ...body],
    }],
  });
  return Packer.toBuffer(doc);
}
