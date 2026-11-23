import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { listProposals } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const u = new URL(req.url);
  const rows = await listProposals({
    commission: u.searchParams.get("commission") || undefined,
    category: u.searchParams.get("category") || undefined,
    q: u.searchParams.get("q")?.slice(0, 100) || undefined,
    sort: u.searchParams.get("sort") === "asc" ? "asc" : "desc",
    identity: (["anonymous", "identified"].includes(u.searchParams.get("identity") || "") ? u.searchParams.get("identity") : "all") as "all",
  });
  return NextResponse.json({ rows }, { headers: { "Cache-Control": "no-store" } });
}
