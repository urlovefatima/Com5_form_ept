// Utilisable dans le middleware (Edge) : pas de dépendance Node ici.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "com5_admin";
export const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 h

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET manquant ou trop court (32 caractères minimum).");
  return new TextEncoder().encode(s);
}

export async function createSessionToken(username: string) {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setAudience("com5-admin")
    .sign(secret());
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: "com5-admin", algorithms: ["HS256"] });
    if (payload.role !== "admin" || payload.sub !== process.env.ADMIN_USERNAME) return null;
    return { username: payload.sub as string };
  } catch {
    return null;
  }
}
