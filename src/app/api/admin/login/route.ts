import { NextResponse } from "next/server";
import { z } from "zod";
import { checkCredentials } from "@/lib/auth";
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/session";
import { clearEvents, isRateLimited, recordEvent } from "@/lib/rate-limit";

export const runtime = "nodejs";
const schema = z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Identifiants requis." }, { status: 400 });

  // 5 tentatives échouées / 15 min par adresse
  const { limited, ipHash } = await isRateLimited("login_fail", req, 5, 15);
  if (limited) return NextResponse.json({ error: "Trop de tentatives. Réessaie dans 15 minutes." }, { status: 429 });

  const ok = await checkCredentials(parsed.data.username, parsed.data.password);
  if (!ok) {
    await recordEvent("login_fail", ipHash);
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect." }, { status: 401 });
  }
  await clearEvents("login_fail", ipHash);
  const token = await createSessionToken(parsed.data.username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
