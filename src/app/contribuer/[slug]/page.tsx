import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCommission, getCommissions, getDepartments } from "@/lib/commissions";
import ContributionForm from "@/components/ContributionForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCommission((await params).slug);
  return { title: c ? `${c.name} · COM5` : "COM5" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [commission, all, departments] = await Promise.all([getCommission(slug), getCommissions(), getDepartments()]);
  if (!commission) notFound();
  const others = all.filter((c) => c.slug !== slug).map((c) => ({ slug: c.slug, shortName: c.shortName }));
  return <ContributionForm commission={commission} departments={departments} others={others} />;
}
