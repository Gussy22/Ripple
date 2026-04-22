"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { Projet, Episode, Contributeur } from "@/lib/types";

export default function TableauDeBord() {
  const params = useParams();
  const searchParams = useSearchParams();
  const estNouveau = searchParams.get("nouveau") === "1";

  const [projet, setProjet] = useState<Projet | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [contributeurs, setContributeurs] = useState<Contributeur[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetch(`/api/projets/${params.id}`);
        const data = await res.json();
        setProjet(data.projet);
        setEpisodes(data.episodes);
        setContributeurs(data.contributeurs);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, [params.id]);

  if (chargement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Chargement…</p>
      </div>
    );
  }

  if (!projet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Projet introuvable.</p>
      </div>
    );
  }

  const statutLabel: Record<string, { label: string; couleur: string }> = {
    en_attente: { label: "En attente", couleur: "text-yellow-600 bg-yellow-50" },
    enregistre: { label: "Enregistré", couleur: "text-blue-600 bg-blue-50" },
    monte: { label: "Monté", couleur: "text-purple-600 bg-purple-50" },
    envoye: { label: "Envoyé ✓", couleur: "text-green-600 bg-green-50" },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-2">
          <a href="/" className="text-2xl font-bold text-gray-900">ripple</a>
        </div>

        {/* Message de succès */}
        {estNouveau && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
            <p className="text-green-700 font-medium">🎉 Projet créé avec succès !</p>
            <p className="text-green-600 text-sm mt-1">
              Les invitations ont été envoyées aux contributeurs.
            </p>
          </div>
        )}

        {/* En-tête du projet */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Podcast pour {projet.destinataire_prenom}
              </h1>
              <p className="text-gray-500 text-sm">{projet.categorie} · {projet.nombre_episodes} épisodes</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              projet.statut === "actif" ? "bg-green-100 text-green-700" :
              projet.statut === "termine" ? "bg-gray-100 text-gray-600" :
              "bg-yellow-100 text-yellow-700"
            }`}>
              {projet.statut === "actif" ? "Actif" : projet.statut === "termine" ? "Terminé" : "Brouillon"}
            </span>
          </div>
        </div>

        {/* Épisodes */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Épisodes</h2>
          <div className="space-y-3">
            {episodes.map((ep) => {
              const s = statutLabel[ep.statut] || { label: ep.statut, couleur: "text-gray-600 bg-gray-50" };
              return (
                <div key={ep.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                      {ep.numero}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{ep.titre}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(ep.date_envoi).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.couleur}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contributeurs */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Contributeurs</h2>
          <div className="space-y-2">
            {contributeurs.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.prenom}</p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                </div>
                <button
                  onClick={() => {
                    const lien = `${window.location.origin}/contribuer/${c.token}`;
                    navigator.clipboard.writeText(lien);
                    alert("Lien copié !");
                  }}
                  className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Copier le lien
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
