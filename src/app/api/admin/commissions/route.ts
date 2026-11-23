import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { getCommission, getCommissions, updateCommission } from "@/lib/commissions";

export const runtime = "nodejs";

const slugId = z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "Identifiant : lettres minuscules, chiffres et tirets uniquement");
const schema = z.object({
  slug: z.string().min(1).max(60),
  sortOrder: z.number().int().min(0).max(100),
  name: z.string().trim().min(2).max(120),
  shortName: z.string().trim().min(2).max(60),
  tagline: z.string().trim().max(160),
  description: z.string().trim().max(1000),
  image: z.string().trim().max(500).refine((s) => s === "" || s.startsWith("/") || /^https:\/\//.test(s), "Image : chemin /images/… ou URL https"),
  imageAlt: z.string().trim().max(200),
  categories: z.array(z.object({ id: slugId, label: z.string().trim().min(2).max(120) })).min(1).max(20)
    .refine((a) => new Set(a.map((c) => c.id)).size === a.length, "Identifiants de catégorie en double"),
  extraFields: z.array(z.object({ key: slugId.transform((s) => s.replace(/-/g, "_")), label: z.string().trim().min(2).max(120),
    placeholder: z.string().max(200).optional(), type: z.enum(["text", "textarea"]) })).max(6),
});

function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return !origin || origin === new URL(req.url).origin;
}

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json({ commissions: await getCommissions() });
}

export async function PUT(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origine refusée" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 422 });
  if (!(await getCommission(parsed.data.slug))) return NextResponse.json({ error: "Commission inconnue" }, { status: 404 });
  await updateCommission(parsed.data);
  return NextResponse.json({ ok: true });
}
