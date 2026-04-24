"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProjetResume {
  id: string;
  destinataire_prenom: string;
  categorie: string;
  statut: string;
  date_debut: string;
  nombre_episodes: number;
  created_at: string;
}

const CATEGORIES_FR: Record<string, string> = {
  anniversaire: "Anniversaire",
  mariage: "Mariage",
  retraite: "Retraite",
  naissance: "Naissance",
  depart: "Départ",
  autre: "Autre occasion",
};

export default function Compte() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [projets, setProjets] = useState<ProjetResume[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetch("/api/compte/moi");
        if (res.status === 401) {
          router.replace("/compte/connexion");
          return;
        }
        const data = await res.json();
        setEmail(data.email);
        setProjets(data.projets);
      } catch {
        router.replace("/compte/connexion");
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, [router]);

  const seDeconnecter = async () => {
    await fetch("/api/compte/deconnexion", { method: "POST" });
    router.replace("/compte/connexion");
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  if (chargement) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="text-ink-muted">Chargement…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">

      {/* Nav */}
      <nav className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
        <Link href="/" className="font-serif italic text-xl font-medium text-ink">dearly</Link>
        <button
          onClick={seDeconnecter}
          className="text-xs text-ink-muted border border-ink/10 px-4 py-2 rounded-full hover:bg-ink/5 transition-colors"
        >
          Se déconnecter
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pb-16">

        {/* En-tête */}
        <div className="mb-8">
          <p className="text-xs text-ink-muted mb-1">{email}</p>
          <h1 className="font-serif text-3xl font-medium text-ink">Mes projets</h1>
        </div>

        {/* Liste des projets */}
        {projets.length === 0 ? (
          <div className="bg-white rounded-3xl border border-ink/6 p-12 text-center">
            <p className="text-ink-muted mb-6 leading-relaxed">
              Vous n&apos;avez pas encore créé de projet.
            </p>
            <Link
              href="/projet/nouveau"
              className="inline-block bg-ink text-cream font-medium px-8 py-3.5 rounded-xl hover:opacity-75 transition-opacity"
            >
              Créer mon premier podcast cadeau
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projets.map(p => (
              <Link
                key={p.id}
                href={`/projet/${p.id}`}
                className="block bg-white rounded-2xl border border-ink/6 p-5 hover:border-clay/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-ink group-hover:text-clay transition-colors truncate">
                        Podcast pour {p.destinataire_prenom}
                      </h2>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                        p.statut === "actif"    ? "bg-green-100 text-green-700" :
                        p.statut === "termine"  ? "bg-gray-100 text-gray-500" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {p.statut === "actif" ? "Actif" : p.statut === "termine" ? "Terminé" : "Brouillon"}
                      </span>
                    </div>
                    <p className="text-sm text-ink-muted">
                      {CATEGORIES_FR[p.categorie] || p.categorie} · {p.nombre_episodes} épisode{p.nombre_episodes > 1 ? "s" : ""} · Créé le {fmtDate(p.created_at)}
                    </p>
                  </div>
                  <svg
                    className="text-ink-muted group-hover:text-clay transition-colors flex-shrink-0"
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </Link>
            ))}

            <Link
              href="/projet/nouveau"
              className="flex items-center justify-center gap-2 w-full border border-dashed border-ink/15 text-ink-muted text-sm py-4 rounded-2xl hover:bg-ink/4 hover:border-ink/25 transition-all mt-2"
            >
              <span>+</span>
              <span>Nouveau projet</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
