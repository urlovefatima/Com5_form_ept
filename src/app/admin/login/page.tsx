"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, LockKeyhole } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Connexion impossible.");
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
      setLoading(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-navy-950 p-5">
      <img src="/images/promo.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(29,78,137,.35),rgba(6,22,41,.95)_70%)]" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Retour au site</Link>
        <form onSubmit={submit} className="rounded-[2rem] border border-white/10 bg-white p-8 shadow-2xl sm:p-10">
          <img src="/images/logo-ept.png" alt="École Polytechnique de Thiès" className="mx-auto h-20 rounded-full bg-navy-950 p-1" />
          <h1 className="mt-6 text-center font-display text-3xl font-semibold text-navy-900">Espace COM5</h1>
          <p className="mt-1 text-center text-sm text-muted">Accès réservé aux administrateurs</p>
          <div className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="u">Nom d&apos;utilisateur</label>
              <input id="u" className="input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="p">Mot de passe</label>
              <input id="p" type="password" className="input" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
          <button disabled={loading} className="btn-navy mt-6 w-full !py-3.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} Se connecter
          </button>
        </form>
      </div>
    </main>
  );
}
