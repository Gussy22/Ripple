"use client";

import { useState } from "react";
import Link from "next/link";

export default function Retrouver() {
  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState<"idle" | "envoi" | "envoye" | "erreur">("idle");

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEtat("envoi");
    try {
      const res = await fetch("/api/retrouver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setEtat("envoye");
    } catch {
      setEtat("erreur");
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="font-serif italic text-2xl font-medium text-ink">
            dearly
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-ink/6 p-8">
          {etat === "envoye" ? (
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: "oklch(93% 0.045 70)" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(60% 0.13 50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h1 className="font-serif text-2xl font-medium text-ink mb-3">Email envoyé</h1>
              <p className="text-ink-muted text-sm leading-relaxed">
                Si un projet existe avec cette adresse, vous allez recevoir un email avec vos liens de tableau de bord.
              </p>
              <Link
                href="/"
                className="inline-block mt-6 text-sm text-ink-muted hover:text-ink transition-colors"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-2xl font-medium text-ink mb-2">
                Retrouver mon tableau de bord
              </h1>
              <p className="text-ink-muted text-sm mb-7 leading-relaxed">
                Entrez l&apos;email que vous avez utilisé pour créer votre projet. Vous recevrez un lien par email.
              </p>

              <form onSubmit={envoyer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Votre adresse email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vous@exemple.fr"
                    required
                    className="w-full border border-ink/12 rounded-xl px-4 py-3 text-ink placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-clay/30 focus:border-clay transition-colors bg-cream"
                  />
                </div>

                {etat === "erreur" && (
                  <p className="text-red-600 text-sm">Une erreur est survenue. Réessayez.</p>
                )}

                <button
                  type="submit"
                  disabled={etat === "envoi"}
                  className="w-full bg-ink text-cream font-medium py-3 rounded-xl hover:opacity-75 transition-opacity disabled:opacity-40"
                >
                  {etat === "envoi" ? "Envoi…" : "Recevoir mes liens"}
                </button>
              </form>

              <p className="text-center mt-5 text-xs text-ink-muted">
                <Link href="/" className="hover:text-ink transition-colors">
                  Retour à l&apos;accueil
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
