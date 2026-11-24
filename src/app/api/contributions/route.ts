import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCommission } from "@/lib/commissions";
import { submissionSchema } from "@/lib/validation";
import { isRateLimited, recordEvent } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_PER_HOUR = 12;
const MIN_FILL_MS = 4000;

export async function POST(req: Request) {
  // Taille maximale du corps (~200 Ko)
  const raw = await req.text();
  if (raw.length > 200_000) return NextResponse.json({ error: "Contribution trop volumineuse." }, { status: 413 });

  let json: unknown;
  try { json = JSON.parse(raw); } catch { return NextResponse.json({ error: "Requête invalide." }, { status: 400 }); }

  const parsed = submissionSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Données invalides.", issues: parsed.error.issues.slice(0, 5) }, { status: 422 });
  }
  const data = parsed.data;

  // Anti-robots : champ piège rempli ou formulaire rempli trop vite => réponse neutre, rien n'est enregistré.
  if (data.website || Date.now() - data.startedAt < MIN_FILL_MS) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  if (!data.anonymous && data.fullName.length < 2) {
    return NextResponse.json({ error: "Indique ton nom ou choisis l'anonymat." }, { status: 422 });
  }

  const commission = await getCommission(data.commissionSlug);
  if (!commission) return NextResponse.json({ error: "Commission inconnue." }, { status: 404 });
  const categories = new Map(commission.categories.map((c) => [c.id, c.label]));
  const extraKeys = new Set(commission.extraFields.map((f) => f.key));
  for (const p of data.proposals) {
    if (!categories.has(p.categoryId)) return NextResponse.json({ error: "Catégorie invalide pour cette commission." }, { status: 422 });
  }

  const { limited, ipHash } = await isRateLimited("submit", req, MAX_PER_HOUR, 60);
  if (limited) return NextResponse.json({ error: "Trop d'envois depuis ta connexion. Réessaie dans une heure." }, { status: 429 });

  const client = await db().connect();
  try {
    await client.query("begin");
    const { rows } = await client.query(
      `insert into submissions (commission_slug, full_name, department, is_anonymous) values ($1,$2,$3,$4) returning id`,
      [commission.slug, data.anonymous ? null : data.fullName, data.department || null, data.anonymous]
    );
    const submissionId = rows[0].id;
    let pos = 1;
    for (const p of data.proposals) {
      const extra = Object.fromEntries(Object.entries(p.extra).filter(([k, v]) => extraKeys.has(k) && v));
      await client.query(
        `insert into proposals (submission_id, commission_slug, position, category_id, category_label, title, description,
           objective, organization, budget_type, budget_amount, period, inclusion, special_note, extra)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [submissionId, commission.slug, pos++, p.categoryId, categories.get(p.categoryId), p.title, p.description,
         p.objective || null, p.organization || null, p.budgetType,
         p.budgetType === "amount" ? p.budgetAmount || null : null,
         p.period || null, p.inclusion || null, p.specialNote || null, JSON.stringify(extra)]
      );
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback").catch(() => {});
    console.error("[contributions] insert failed", e);
    return NextResponse.json({ error: "Erreur serveur lors de l'enregistrement." }, { status: 500 });
  } finally {
    client.release(); // libérer AVANT toute autre requête (pool d'une seule connexion sur Vercel)
  }
  // Journal anti-spam : un échec ici ne doit jamais faire croire que l'envoi a échoué
  await recordEvent("submit", ipHash).catch((e) => console.error("[contributions] rate log failed", e));
  return NextResponse.json({ ok: true, proposals: data.proposals.length }, { status: 201 });
}
