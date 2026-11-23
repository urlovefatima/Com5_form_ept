import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __com5Pool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL manquant : configurez la connexion Postgres (voir README).");
  }
  const isLocal = /@(localhost|127\.0\.0\.1)(:|\/)/.test(connectionString);
  return new Pool({
    connectionString,
    // Sur Vercel (serverless), peu de connexions par instance ; le pooler Supabase fait le reste.
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
