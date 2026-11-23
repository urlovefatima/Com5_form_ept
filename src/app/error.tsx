"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-sky-50 p-6 text-center">
      <div className="card max-w-md p-10">
        <img src="/images/emblem-ept.png" alt="" className="mx-auto h-12" />
        <h1 className="mt-6 font-display text-2xl font-semibold text-navy-900">Un souci technique est survenu</h1>
        <p className="mt-3 text-muted">La plateforme n&apos;a pas pu charger les données. Réessaie dans un instant.</p>
        <button onClick={reset} className="btn-navy mt-6">Réessayer</button>
      </div>
    </main>
  );
}
