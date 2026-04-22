"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { Contributeur, Projet } from "@/lib/types";

type EtatEnregistrement = "idle" | "enregistrement" | "termine" | "envoye" | "erreur";

export default function PageContributeur() {
  const params = useParams();
  const [contributeur, setContributeur] = useState<Contributeur | null>(null);
  const [projet, setProjet] = useState<Projet | null>(null);
  const [chargement, setChargement] = useState(true);
  const [etat, setEtat] = useState<EtatEnregistrement>("idle");
  const [duree, setDuree] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const DUREE_MIN = 3 * 60; // 3 minutes en secondes
  const DUREE_MAX = 5 * 60; // 5 minutes

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetch(`/api/contributeurs/${params.token}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setContributeur(data.contributeur);
        setProjet(data.projet);
      } catch {
        setErreur("Lien invalide ou expiré.");
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, [params.token]);

  const demarrerEnregistrement = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

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
          if (d + 1 >= DUREE_MAX) {
            arreterEnregistrement();
          }
          return d + 1;
        });
      }, 1000);
    } catch {
      setErreur("Impossible d'accéder au microphone. Vérifiez les permissions de votre navigateur.");
    }
  };

  const arreterEnregistrement = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const recommencer = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setDuree(0);
    setEtat("idle");
  };

  const envoyer = async () => {
    if (!audioBlob) return;
    setEtat("envoye");
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "enregistrement.webm");
      formData.append("token", params.token as string);
      formData.append("duree", String(duree));

      const res = await fetch("/api/enregistrements", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();
    } catch {
      setEtat("erreur");
      setErreur("Erreur lors de l'envoi. Réessayez.");
    }
  };

  const formatDuree = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPct = Math.min((duree / DUREE_MAX) * 100, 100);
  const dansBonneDuree = duree >= DUREE_MIN && duree <= DUREE_MAX;

  if (chargement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Chargement…</p>
      </div>
    );
  }

  if (erreur && !contributeur) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-gray-700 font-medium">{erreur}</p>
        </div>
      </div>
    );
  }

  if (etat === "envoye") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-6xl mb-6">🎉</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Message envoyé !</h1>
          <p className="text-gray-500">
            Merci {contributeur?.prenom} ! Votre message vocal a bien été reçu et sera intégré dans le podcast de {projet?.destinataire_prenom}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold text-gray-900">ripple</a>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {/* En-tête */}
          <div className="text-center mb-8">
            <p className="text-gray-500 text-sm mb-1">Bonjour {contributeur?.prenom} 👋</p>
            <h1 className="text-xl font-bold text-gray-900">
              Enregistrez votre message pour {projet?.destinataire_prenom}
            </h1>
            <p className="text-gray-400 text-sm mt-2">Entre 3 et 5 minutes</p>
          </div>

          {/* Zone d'enregistrement */}
          {etat === "idle" && (
            <div className="text-center">
              <button
                onClick={demarrerEnregistrement}
                className="w-24 h-24 rounded-full bg-red-500 text-white text-4xl hover:bg-red-400 active:scale-95 transition-all shadow-lg mx-auto flex items-center justify-center"
              >
                🎙️
              </button>
              <p className="text-gray-400 text-sm mt-4">Appuyez pour commencer</p>
            </div>
          )}

          {etat === "enregistrement" && (
            <div className="text-center">
              {/* Indicateur animé */}
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-75" />
                <button
                  onClick={arreterEnregistrement}
                  className="relative w-24 h-24 rounded-full bg-red-500 text-white text-4xl hover:bg-red-400 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                >
                  ⏹️
                </button>
              </div>

              {/* Durée */}
              <p className="text-3xl font-mono font-bold text-gray-900 mb-2">{formatDuree(duree)}</p>
              <p className="text-sm text-gray-400 mb-4">Appuyez pour arrêter</p>

              {/* Barre de progression */}
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    duree < DUREE_MIN ? "bg-orange-400" : "bg-green-400"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0:00</span>
                <span className="text-orange-500">3:00 min</span>
                <span>5:00</span>
              </div>
            </div>
          )}

          {etat === "termine" && audioUrl && (
            <div>
              {/* Indicateur durée */}
              <div className={`text-center mb-4 p-3 rounded-xl ${dansBonneDuree ? "bg-green-50" : "bg-orange-50"}`}>
                <p className={`font-medium text-sm ${dansBonneDuree ? "text-green-700" : "text-orange-700"}`}>
                  {dansBonneDuree
                    ? `✓ Durée parfaite : ${formatDuree(duree)}`
                    : duree < DUREE_MIN
                    ? `⚠️ Trop court : ${formatDuree(duree)} (minimum 3:00)`
                    : `⚠️ Trop long : ${formatDuree(duree)} (maximum 5:00)`}
                </p>
              </div>

              {/* Lecteur audio */}
              <audio controls src={audioUrl} className="w-full mb-6 rounded-xl" />

              {erreur && <p className="text-red-500 text-sm mb-4">{erreur}</p>}

              <div className="flex gap-3">
                <button
                  onClick={recommencer}
                  className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Recommencer
                </button>
                <button
                  onClick={envoyer}
                  className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
                >
                  Envoyer ✓
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
