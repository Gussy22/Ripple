"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Contributeur, Projet, Episode, Enregistrement } from "@/lib/types";

type RecEtat = "idle" | "enregistrement" | "termine" | "envoye";

export default function PageContributeur() {
  const params = useParams();

  const [contributeur, setContributeur] = useState<Contributeur | null>(null);
  const [projet, setProjet] = useState<Projet | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [enregistrements, setEnregistrements] = useState<Enregistrement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreurPage, setErreurPage] = useState("");

  const [recEpisodeId, setRecEpisodeId] = useState<string | null>(null);
  const [recEtat, setRecEtat] = useState<RecEtat>("idle");
  const [recDuree, setRecDuree] = useState(0);
  const [recBlob, setRecBlob] = useState<Blob | null>(null);
  const [recUrl, setRecUrl] = useState<string | null>(null);
  const [recEnvoi, setRecEnvoi] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const DUREE_MAX = 10 * 60; // 10 minutes max, sans contrainte de minimum

  const charger = useCallback(async () => {
    try {
      const res = await fetch(`/api/contributeurs/${params.token}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setContributeur(data.contributeur);
      setProjet(data.projet);
      setEpisodes(data.episodes || []);
      setEnregistrements(data.enregistrements || []);
    } catch {
      setErreurPage("Ce lien est invalide ou a expiré.");
    } finally {
      setChargement(false);
    }
  }, [params.token]);

  useEffect(() => { charger(); }, [charger]);

  // Épisodes déjà enregistrés par ce contributeur
  const episodesEnregistres = useMemo(() => {
    const ids = new Set<string>();
    enregistrements.forEach(r => { if (r.episode_id) ids.add(r.episode_id); });
    return ids;
  }, [enregistrements]);

  const demarrerRec = async (episodeId: string) => {
    if (recEpisodeId && recEpisodeId !== episodeId) resetRec();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecBlob(blob);
        setRecUrl(URL.createObjectURL(blob));
        setRecEtat("termine");
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecDuree(0);
      setRecEpisodeId(episodeId);
      setRecEtat("enregistrement");
      intervalRef.current = setInterval(() => {
        setRecDuree(d => {
          if (d + 1 >= DUREE_MAX) arreterRec();
          return d + 1;
        });
      }, 1000);
    } catch {
      alert("Impossible d'accéder au microphone. Vérifiez les permissions de votre navigateur.");
    }
  };

  const arreterRec = () => {
    if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resetRec = () => {
    setRecBlob(null); setRecUrl(null); setRecDuree(0);
    setRecEtat("idle"); setRecEpisodeId(null);
  };

  const envoyerRec = async () => {
    if (!recBlob || !contributeur || !recEpisodeId) return;
    setRecEnvoi(true);
    try {
      const formData = new FormData();
      formData.append("audio", recBlob, "enregistrement.webm");
      formData.append("token", params.token as string);
      formData.append("duree", String(recDuree));
      formData.append("episodeId", recEpisodeId);
      const res = await fetch("/api/enregistrements", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      setRecEtat("envoye");
      // Recharger pour mettre à jour les statuts
      await charger();
      // Fermer le recorder après 2 secondes
      setTimeout(resetRec, 2000);
    } catch {
      alert("Erreur lors de l'envoi. Réessayez.");
    } finally {
      setRecEnvoi(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  // --- États de chargement et d'erreur ---

  if (chargement) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="text-ink-muted">Chargement…</p>
    </div>
  );

  if (erreurPage) return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="text-center">
        <Link href="/" className="font-serif italic text-2xl font-medium text-ink mb-8 block">dearly</Link>
        <p className="text-ink-muted">{erreurPage}</p>
      </div>
    </div>
  );

  const totalEnregistrés = episodesEnregistres.size;
  const tousEnregistrés = totalEnregistrés === episodes.length && episodes.length > 0;

  return (
    <div className="min-h-screen bg-cream">

      <nav className="max-w-2xl mx-auto px-4 py-5">
        <Link href="/" className="font-serif italic text-xl font-medium text-ink">dearly</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pb-16 space-y-4">

        {/* En-tête */}
        <div className="bg-white rounded-3xl border border-ink/6 p-6">
          <p className="text-ink-muted text-sm mb-1">Bonjour {contributeur?.prenom}</p>
          <h1 className="font-serif text-2xl font-medium text-ink leading-tight mb-4">
            Vous participez au podcast de{" "}
            <em className="text-clay not-italic">{projet?.destinataire_prenom}</em>
          </h1>

          {tousEnregistrés ? (
            <div
              className="rounded-2xl px-4 py-3 text-sm font-medium text-ink"
              style={{ backgroundColor: "oklch(93% 0.045 70)" }}
            >
              Vous avez enregistré tous les épisodes. Merci pour votre participation.
            </div>
          ) : (
            <p className="text-ink-muted text-sm leading-relaxed">
              Enregistrez votre message pour chaque épisode ci-dessous.
              Prenez le temps qu&apos;il vous faut — pas de durée imposée.
            </p>
          )}
        </div>

        {/* Épisodes */}
        <div className="bg-white rounded-3xl border border-ink/6 p-6">
          <h2 className="font-semibold text-ink mb-4">
            Épisodes
            <span className="ml-2 text-xs font-normal text-ink-muted">
              {totalEnregistrés}/{episodes.length} enregistré{totalEnregistrés > 1 ? "s" : ""}
            </span>
          </h2>

          <div className="space-y-3">
            {episodes.map((ep) => {
              const déjàEnregistré = episodesEnregistres.has(ep.id);
              const isRecording = recEpisodeId === ep.id;
              const vientDEnvoyer = recEtat === "envoye" && isRecording;

              return (
                <div key={ep.id} className="rounded-2xl border border-ink/6 overflow-hidden">
                  {/* Ligne principale */}
                  <div className="flex items-center gap-3 p-4">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                      style={{ backgroundColor: "oklch(60% 0.13 50)" }}
                    >
                      {ep.numero}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{ep.titre}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{fmtDate(ep.date_envoi)}</p>
                    </div>

                    <div className="flex-shrink-0">
                      {déjàEnregistré || vientDEnvoyer ? (
                        <span className="text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                          Enregistré ✓
                        </span>
                      ) : isRecording ? (
                        <button onClick={resetRec}
                          className="text-xs text-ink-muted border border-ink/10 px-3 py-1.5 rounded-lg hover:bg-ink/5">
                          Fermer
                        </button>
                      ) : (
                        <button onClick={() => demarrerRec(ep.id)}
                          className="text-xs bg-ink text-cream px-3 py-1.5 rounded-lg hover:opacity-75 transition-opacity">
                          Enregistrer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recorder inline */}
                  {isRecording && recEtat !== "envoye" && (
                    <div className="border-t border-ink/6 bg-cream px-4 py-6">
                      {recEtat === "idle" && (
                        <div className="text-center">
                          <button
                            onClick={() => demarrerRec(ep.id)}
                            className="w-20 h-20 rounded-full bg-red-500 text-white text-3xl hover:bg-red-400 active:scale-95 transition-all shadow-lg mx-auto flex items-center justify-center"
                          >
                            🎙️
                          </button>
                          <p className="text-ink-muted text-sm mt-4">Appuyez pour commencer</p>
                          <p className="text-ink-muted text-xs mt-1">Prenez le temps qu&apos;il vous faut</p>
                        </div>
                      )}

                      {recEtat === "enregistrement" && (
                        <div className="text-center">
                          <div className="relative w-20 h-20 mx-auto mb-4">
                            <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-75" />
                            <button
                              onClick={arreterRec}
                              className="relative w-20 h-20 rounded-full bg-red-500 text-white text-3xl hover:bg-red-400 shadow-lg flex items-center justify-center"
                            >
                              ⏹
                            </button>
                          </div>
                          <p className="text-3xl font-mono font-bold text-ink">{fmt(recDuree)}</p>
                          <p className="text-ink-muted text-sm mt-2">Appuyez pour arrêter</p>
                        </div>
                      )}

                      {recEtat === "termine" && recUrl && (
                        <div>
                          <p className="text-sm text-ink-muted mb-3 text-center">
                            Écoutez votre enregistrement, puis validez.
                          </p>
                          <audio controls src={recUrl} className="w-full mb-4 rounded-xl" />
                          <div className="flex gap-3">
                            <button onClick={resetRec}
                              className="flex-1 border border-ink/10 text-ink-muted py-3 rounded-xl text-sm hover:bg-ink/5 transition-colors">
                              Recommencer
                            </button>
                            <button onClick={envoyerRec} disabled={recEnvoi}
                              className="flex-1 bg-ink text-cream py-3 rounded-xl text-sm font-medium hover:opacity-75 transition-opacity disabled:opacity-40">
                              {recEnvoi ? "Envoi…" : "Valider ✓"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-ink-muted pb-4">
          {projet?.destinataire_prenom} recevra ce podcast comme une surprise.
        </p>

      </div>
    </div>
  );
}
