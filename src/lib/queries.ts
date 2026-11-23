import "server-only";
import { db } from "./db";
import type { ProposalRow } from "./types";

function mapRow(r: any): ProposalRow {
  return {
    id: r.id,
    submissionId: r.submission_id,
    commissionSlug: r.commission_slug,
    position: r.position,
    categoryId: r.category_id,
    categoryLabel: r.category_label,
    title: r.title,
    description: r.description,
    objective: r.objective,
    organization: r.organization,
    budgetType: r.budget_type,
    budgetAmount: r.budget_amount,
    period: r.period,
    inclusion: r.inclusion,
    specialNote: r.special_note,
    extra: r.extra ?? {},
    createdAt: new Date(r.created_at).toISOString(),
    fullName: r.full_name,
    department: r.department,
    isAnonymous: r.is_anonymous,
  };
}

export type ListFilters = {
  commission?: string;
  category?: string;
  q?: string;
  sort?: "asc" | "desc";
  identity?: "all" | "anonymous" | "identified";
  limit?: number;
};

export async function listProposals(f: ListFilters = {}): Promise<ProposalRow[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.commission) { params.push(f.commission); where.push(`p.commission_slug = $${params.length}`); }
  if (f.category) { params.push(f.category); where.push(`p.category_id = $${params.length}`); }
  if (f.identity === "anonymous") where.push("s.is_anonymous = true");
  if (f.identity === "identified") where.push("s.is_anonymous = false");
  if (f.q && f.q.trim()) {
    params.push(`%${f.q.trim().replace(/[\\%_]/g, (m) => "\\" + m)}%`);
    const i = params.length;
    where.push(`(p.title ilike $${i} or p.description ilike $${i} or coalesce(s.full_name,'') ilike $${i}
      or p.category_label ilike $${i} or coalesce(p.special_note,'') ilike $${i} or coalesce(p.objective,'') ilike $${i}
      or coalesce(p.organization,'') ilike $${i} or p.extra::text ilike $${i})`);
  }
  const order = f.sort === "asc" ? "asc" : "desc";
  let sql = `select p.*, s.full_name, s.department, s.is_anonymous
             from proposals p join submissions s on s.id = p.submission_id
             ${where.length ? "where " + where.join(" and ") : ""}
             order by p.created_at ${order}, p.position asc`;
  if (f.limit) { params.push(f.limit); sql += ` limit $${params.length}`; }
  const { rows } = await db().query(sql, params);
  return rows.map(mapRow);
}

export async function getStats() {
  const pool = db();
  const [totals, perCommission, latest] = await Promise.all([
    pool.query(`select
        (select count(*)::int from submissions) as contributions,
        (select count(*)::int from proposals) as proposals,
        (select count(distinct lower(trim(full_name)))::int from submissions where not is_anonymous and full_name is not null and full_name <> '') as identified,
        (select count(*)::int from submissions where is_anonymous) as anonymous,
        (select count(*)::int from proposals where coalesce(special_note,'') <> '') as notes`),
    pool.query(`select c.slug, c.short_name, c.sort_order,
        (select count(*)::int from proposals p where p.commission_slug = c.slug) as proposals,
        (select count(*)::int from submissions s where s.commission_slug = c.slug) as contributions
        from commissions c order by c.sort_order`),
    listProposals({ limit: 6 }),
  ]);
  return {
    ...totals.rows[0],
    perCommission: perCommission.rows as { slug: string; short_name: string; proposals: number; contributions: number }[],
    latest,
  } as {
    contributions: number; proposals: number; identified: number; anonymous: number; notes: number;
    perCommission: { slug: string; short_name: string; proposals: number; contributions: number }[];
    latest: ProposalRow[];
  };
}
