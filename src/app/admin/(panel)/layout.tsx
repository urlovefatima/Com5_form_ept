import { redirect } from "next/navigation";
import { getAdmin } from "../../../lib/auth";
import AdminNav from "../../../components/admin/AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Espace COM5 · Administration", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return (
    <div className="min-h-screen bg-sky-50 lg:flex">
      <AdminNav username={admin.username} />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</main>
    </div>
  );
}
