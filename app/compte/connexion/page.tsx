"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FormulaireConnexion() {
  const searchParams = useSearchParams();
  const erreurParam = searchParams.get("erreur");

  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState<"idle" | "envoi" | "envoye" | "erreur">("idle");
  const [messageErreur, setMessageErreur] = useState("");

  useEffect(() => {
    if (erreurParam === "lien-expire") setMessageErreur("Ce lien a expiré. Demandez-en un nouveau.");
    if (erreurParam === "lien-invalide") setMessageErreur("Ce lien est invalide.");
  }, [erreurParam]);

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEtat("envoi");
    setMessageErreur("");
    try {
      const res = await fetch("/api/compte/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setEtat("envoye");
    } catch {
      setEtat("erreur");
      setMessageErreur("Une erreur est survenue. Réessayez.");
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <Link href="/" className="font-serif italic text-2xl font-medium text-ink">dearly</Link>
        </div>

        <div className="bg-white rounded-3xl border border-ink/6 p-8">
          {etat === "envoye" ? (
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: "oklch(93% 0.045 70)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="oklch(60% 0.13 50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 className="font-serif text-xl font-medium text-ink mb-2">Email envoyé</h2>
              <p className="text-ink-muted text-sm leading-relaxed">
                Un lien de connexion vient d&apos;être envoyé à <strong>{email}</strong>.
                Il est valable 1 heure.
              </p>
              <button
                onClick={() => setEtat("idle")}
                className="mt-6 text-sm text-ink-muted underline hover:text-ink transition-colors"
              >
                Changer d&apos;adresse email
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-2xl font-medium text-ink mb-2">Mon espace</h1>
              <p className="text-ink-muted text-sm mb-7 leading-relaxed">
                Entrez votre email pour recevoir un lien de connexion. Aucun mot de passe nécessaire.
              </p>

              {(messageErreur || etat === "erreur") && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-red-700 text-sm">{messageErreur || "Une erreur est survenue."}</p>
                </div>
              )}

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
                    className="w-full border border-ink/12 rounded-xl px-4 py-3 text-ink placeholder-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-clay/30 focus:border-clay transition-colors bg-cream"
                  />
                </div>

                <button
                  type="submit"
                  disabled={etat === "envoi"}
                  className="w-full bg-ink text-cream font-medium py-3 rounded-xl hover:opacity-75 transition-opacity disabled:opacity-40"
                >
                  {etat === "envoi" ? "Envoi…" : "Recevoir mon lien de connexion"}
                </button>
              </form>

              <p className="text-center mt-6 text-xs text-ink-muted">
                Pas encore de projet ?{" "}
                <Link href="/projet/nouveau" className="underline hover:text-ink transition-colors">
                  Créer mon premier podcast
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PageConnexion() {
  return (
    <Suspense>
      <FormulaireConnexion />
    </Suspense>
  );
}
