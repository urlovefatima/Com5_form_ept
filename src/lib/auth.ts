import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";

// Hash factice : on compare toujours un hash, même si l'identifiant est faux (temps constant).
const DUMMY_HASH = "$2b$12$nhQ1J4vuLSmVvda4W48iVO7tz3QrLti83YNi2kGNefdTOn1TVuD5K";

export async function checkCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUser || !hash) throw new Error("ADMIN_USERNAME / ADMIN_PASSWORD_HASH non configurés.");
  const userOk = username === expectedUser;
  const passOk = await bcrypt.compare(password, userOk ? hash : DUMMY_HASH);
  return userOk && passOk;
}

export async function getAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** À appeler en tête de chaque route API admin (défense en profondeur, en plus du middleware). */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });
  return admin;
}
