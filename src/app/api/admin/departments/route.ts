import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { getDepartments, setDepartments } from "@/lib/commissions";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json({ departments: await getDepartments() });
}

export async function PUT(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Origine refusée" }, { status: 403 });
  const parsed = z.object({ departments: z.array(z.string().trim().min(1).max(120)).max(30) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Liste invalide" }, { status: 422 });
  await setDepartments(parsed.data.departments);
  return NextResponse.json({ ok: true });
}
