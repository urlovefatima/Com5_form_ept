import "server-only";
import { db } from "./db";
import defaults from "./default-commissions.json";
import type { Commission } from "./types";

export const DEFAULT_DEPARTMENTS = [
  "Génie Informatique et Télécommunications (GIT)",
  "Génie Civil (GC)",
  "Génie Électromécanique (GEM)",
  "Génie Aéronautique",
  "Autre",
];

function rowToCommission(r: any): Commission {
  return {
    slug: r.slug,
    sortOrder: r.sort_order,
    name: r.name,
    shortName: r.short_name,
    tagline: r.tagline,
    description: r.description,
    image: r.image,
    imageAlt: r.image_alt,
    categories: r.categories ?? [],
    extraFields: r.extra_fields ?? [],
  };
}

let seeded = false;
/** Insère la configuration par défaut si la table est vide (premier démarrage). */
async function ensureSeed() {
  if (seeded) return;
  const { rows } = await db().query("select count(*)::int as n from commissions");
  if (rows[0].n === 0) {
    for (const c of defaults as Commission[]) {
      await db().query(
        `insert into commissions (slug, sort_order, name, short_name, tagline, description, image, image_alt, categories, extra_fields)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (slug) do nothing`,
        [c.slug, c.sortOrder, c.name, c.shortName, c.tagline, c.description, c.image, c.imageAlt,
         JSON.stringify(c.categories), JSON.stringify(c.extraFields)]
      );
    }
    await db().query(
      `insert into settings (key, value) values ('departments', $1) on conflict (key) do nothing`,
      [JSON.stringify(DEFAULT_DEPARTMENTS)]
    );
  }
  seeded = true;
}

export async function getCommissions(): Promise<Commission[]> {
  await ensureSeed();
  const { rows } = await db().query("select * from commissions order by sort_order, name");
  return rows.map(rowToCommission);
}

export async function getCommission(slug: string): Promise<Commission | null> {
  await ensureSeed();
  const { rows } = await db().query("select * from commissions where slug = $1", [slug]);
  return rows[0] ? rowToCommission(rows[0]) : null;
}

export async function updateCommission(c: Commission) {
  await db().query(
    `update commissions set sort_order=$2, name=$3, short_name=$4, tagline=$5, description=$6,
       image=$7, image_alt=$8, categories=$9, extra_fields=$10, updated_at=now() where slug=$1`,
    [c.slug, c.sortOrder, c.name, c.shortName, c.tagline, c.description, c.image, c.imageAlt,
     JSON.stringify(c.categories), JSON.stringify(c.extraFields)]
  );
}

export async function getDepartments(): Promise<string[]> {
  await ensureSeed();
  const { rows } = await db().query("select value from settings where key='departments'");
  return rows[0]?.value ?? DEFAULT_DEPARTMENTS;
}

export async function setDepartments(list: string[]) {
  await db().query(
    `insert into settings (key, value, updated_at) values ('departments', $1, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(list)]
  );
}
