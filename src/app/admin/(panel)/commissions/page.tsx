import { getCommissions, getDepartments } from "../../../../lib/commissions";
import CommissionsEditor from "../../../../components/admin/CommissionsEditor";

export default async function Page() {
  const [commissions, departments] = await Promise.all([getCommissions(), getDepartments()]);
  return <CommissionsEditor initial={commissions} initialDepartments={departments} />;
}
