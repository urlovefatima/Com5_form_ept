import { readFileSync } from "fs";
import pg from "pg";
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL manquant"); process.exit(1); }
const local = /@(localhost|127\.0\.0\.1)/.test(url);
const c = new pg.Client({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: false } });
await c.connect();
await c.query(readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8"));
await c.end();
console.log("✓ Schéma appliqué");
