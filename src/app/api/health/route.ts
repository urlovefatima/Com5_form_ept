import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Diagnostic de déploiement : indique ce qui manque, sans jamais afficher de secret. */
export async function GET() {
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    ADMIN_USERNAME: !!process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH: (process.env.ADMIN_PASSWORD_HASH || "").startsWith("$2"),
    SESSION_SECRET: (process.env.SESSION_SECRET || "").length >= 32,
    IP_HASH_SALT: !!process.env.IP_HASH_SALT,
  };
  let database = "ok";
  let hint = "";
  try {
    const { rows } = await db().query("select to_regclass('public.commissions') as t");
    if (!rows[0].t) { database = "tables manquantes"; hint = "Exécutez supabase/schema.sql dans le SQL Editor de Supabase."; }
  } catch (e: any) {
    const msg = String(e?.message || e);
    database = `erreur : ${e?.code ?? ""} ${msg.replace(/postgres(ql)?:\/\/[^\s]+/g, "[url masquée]")}`.trim();
    if (/password authentication/i.test(msg)) hint = "Mot de passe incorrect dans DATABASE_URL (pensez à retirer les crochets [ ]).";
    else if (/ENOTFOUND|ENETUNREACH|EAI_AGAIN/.test(msg)) hint = "Hôte injoignable : utilisez l'URL du Transaction pooler (port 6543), pas la connexion directe.";
    else if (/Tenant or user not found/i.test(msg)) hint = "Identifiant incorrect : l'utilisateur doit être de la forme postgres.<ref-du-projet>.";
    else if (/timeout/i.test(msg)) hint = "Délai dépassé : vérifiez l'hôte et le port 6543.";
    else if (/DATABASE_URL manquant/.test(msg)) hint = "Ajoutez DATABASE_URL dans Vercel puis redéployez.";
    else if (/URI|Invalid URL|malformed/i.test(msg)) hint = "URL invalide : un caractère spécial (@ # / ? %) dans le mot de passe ? Régénérez-le avec seulement lettres et chiffres.";
  }
  return NextResponse.json({ env, database, hint }, { headers: { "Cache-Control": "no-store" } });
}
