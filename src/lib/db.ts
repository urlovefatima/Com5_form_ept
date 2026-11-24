import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __com5Pool: Pool | undefined;
}

function createPool() {
  const raw = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, "");
  if (!raw) throw new Error("DATABASE_URL manquant : configurez la connexion Postgres (voir README).");
  const isLocal = /@(localhost|127\.0\.0\.1)(:|\/)/.test(raw);
  // Un `?sslmode=require` dans l'URL force une vérification stricte du certificat Supabase
  // ("self-signed certificate in certificate chain") : on le retire et on gère le SSL ici.
  let connectionString = raw;
  try {
    const u = new URL(raw);
    ["sslmode", "sslrootcert", "sslcert", "sslkey"].forEach((k) => u.searchParams.delete(k));
    connectionString = u.toString();
  } catch { /* URL non standard : on la garde telle quelle */ }
  return new Pool({
    connectionString,
    max: process.env.VERCEL ? 1 : 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
}

export function db(): Pool {
  if (!global.__com5Pool) global.__com5Pool = createPool();
  return global.__com5Pool;
}
