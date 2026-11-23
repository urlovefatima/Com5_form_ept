import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-sky-50 p-6 text-center">
      <div className="card max-w-md p-10">
        <img src="/images/emblem-ept.png" alt="" className="mx-auto h-12" />
        <h1 className="mt-6 font-display text-2xl font-semibold text-navy-900">Page introuvable</h1>
        <p className="mt-3 text-muted">Cette page n&apos;existe pas ou plus.</p>
        <Link href="/" className="btn-navy mt-6">Retour à l&apos;accueil</Link>
      </div>
    </main>
  );
}
