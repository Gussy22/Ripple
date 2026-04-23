"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { Projet, Episode, Contributeur } from "@/lib/types";

type EtatEnregistrement = "idle" | "enregistrement" | "termine" | "envoye";

export default function TableauDeBord() {
  const params = useParams();
  const searchParams = useSearchParams();
  const estNouveau = searchParams.get("nouveau") === "1";

  const [projet, setProjet] = useState<Projet | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [contributeurs, setContributeurs] = useState<Contributeur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [afficherEnregistrement, setAfficherEnregistrement] = useState(false);

  // Enregistrement organisateur
  const [etat, setEtat] = useState<EtatEnregistrement>("idle");
  const [duree, setDuree] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const DUREE_MAX = 5 * 60;

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

  const demarrer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setEtat("termine");
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setDuree(0);
      setEtat("enregistrement");
      intervalRef.current = setInterval(() => {
        setDuree((d) => {
          if (d + 1 >= DUREE_MAX) arreter();
          return d + 1;
        });
      }, 1000);
    } catch {
      alert("Impossible d'accéder au microphone.");
    }
  };

  const arreter = () => {
    if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const recommencer = () => {
    setAudioBlob(null); setAudioUrl(null); setDuree(0); setEtat("idle");
  };

  const envoyer = async () => {
    if (!audioBlob || !projet) return;
    setEnvoi(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "enregistrement.webm");
      formData.append("duree", String(duree));
      const res = await fetch(`/api/projets/${projet.id}/enregistrement`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      setEtat("envoye");
    } catch {
      alert("Erreur lors de l'envoi. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (chargement) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Chargement…</p>
    </div>
  );

  if (!projet) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Projet introuvable.</p>
    </div>
  );

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
          <a href="/" className="text-2xl font-bold text-gray-900">dearly</a>
        </div>

        {estNouveau && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
            <p className="text-green-700 font-medium">🎉 Projet créé avec succès !</p>
            <p className="text-green-600 text-sm mt-1">Les invitations ont été envoyées aux contributeurs.</p>
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

        {/* Mon message vocal */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Mon message vocal</h2>
              <p className="text-sm text-gray-400 mt-0.5">Ajoutez votre propre voix au podcast</p>
            </div>
            {etat === "envoye" ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Enregistré ✓</span>
            ) : (
              <button
                onClick={() => setAfficherEnregistrement(!afficherEnregistrement)}
                className="text-sm bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors"
              >
                {afficherEnregistrement ? "Fermer" : "🎙️ Enregistrer"}
              </button>
            )}
          </div>

          {afficherEnregistrement && etat !== "envoye" && (
            <div className="border-t border-gray-100 pt-5">
              {etat === "idle" && (
                <div className="text-center py-4">
                  <button
                    onClick={demarrer}
                    className="w-20 h-20 rounded-full bg-red-500 text-white text-3xl hover:bg-red-400 active:scale-95 transition-all shadow-lg mx-auto flex items-center justify-center"
                  >
                    🎙️
                  </button>
                  <p className="text-gray-400 text-sm mt-3">Appuyez pour commencer</p>
                </div>
              )}

              {etat === "enregistrement" && (
                <div className="text-center py-4">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-75" />
                    <button
                      onClick={arreter}
                      className="relative w-20 h-20 rounded-full bg-red-500 text-white text-3xl hover:bg-red-400 transition-all shadow-lg flex items-center justify-center"
                    >
                      ⏹️
                    </button>
                  </div>
                  <p className="text-2xl font-mono font-bold text-gray-900 mb-1">{fmt(duree)}</p>
                  <p className="text-sm text-gray-400">Appuyez pour arrêter</p>
                </div>
              )}

              {etat === "termine" && audioUrl && (
                <div>
                  <audio controls src={audioUrl} className="w-full mb-4 rounded-xl" />
                  <div className="flex gap-3">
                    <button onClick={recommencer} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                      Recommencer
                    </button>
                    <button onClick={envoyer} disabled={envoi} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50">
                      {envoi ? "Envoi…" : "Valider ✓"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {etat === "envoye" && (
            <p className="text-sm text-gray-500">Votre message vocal a été ajouté au podcast. 🎉</p>
          )}
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
            {contributeurs.filter(c => c.email !== projet.organisateur_email).map((c) => (
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
