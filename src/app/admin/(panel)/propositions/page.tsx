import { getCommissions } from "../../../../lib/commissions";
import ProposalsBrowser from "../../../../components/admin/ProposalsBrowser";

export default async function Page({ searchParams }: { searchParams: Promise<{ commission?: string }> }) {
  const [commissions, sp] = await Promise.all([getCommissions(), searchParams]);
  return <ProposalsBrowser commissions={commissions} initialCommission={sp.commission ?? ""} />;
}
