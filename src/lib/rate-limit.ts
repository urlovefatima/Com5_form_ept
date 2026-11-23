import "server-only";
import { createHash } from "crypto";
import { db } from "./db";

export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}

export function hashIp(ip: string) {
  return createHash("sha256").update((process.env.IP_HASH_SALT || "com5") + ip).digest("hex").slice(0, 32);
}

/** Retourne true si la limite est dépassée. Stocké en base : fonctionne en serverless (Vercel). */
export async function isRateLimited(kind: string, req: Request, max: number, windowMinutes: number) {
  const ipHash = hashIp(clientIp(req));
  const { rows } = await db().query(
    `select count(*)::int as n from rate_events
     where kind=$1 and ip_hash=$2 and created_at > now() - ($3 || ' minutes')::interval`,
    [kind, ipHash, String(windowMinutes)]
  );
  return { limited: rows[0].n >= max, ipHash };
}

export async function recordEvent(kind: string, ipHash: string) {
  await db().query("insert into rate_events (kind, ip_hash) values ($1,$2)", [kind, ipHash]);
  // Nettoyage opportuniste (> 2 jours)
  if (Math.random() < 0.05) await db().query("delete from rate_events where created_at < now() - interval '2 days'");
}

export async function clearEvents(kind: string, ipHash: string) {
  await db().query("delete from rate_events where kind=$1 and ip_hash=$2", [kind, ipHash]);
}
