"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Projet, Episode, Contributeur, Enregistrement } from "@/lib/types";
import { JINGLES_PRESETS } from "@/lib/jingles-presets";

type RecEtat = "idle" | "enregistrement" | "termine" | "envoye";
type ApercuEtat = "idle" | "chargement" | "pret" | "valide";

const AVATAR_COLORS = [
  "oklch(76% 0.12 50)",
  "oklch(66% 0.12 250)",
  "oklch(68% 0.11 160)",
  "oklch(68% 0.11 310)",
  "oklch(72% 0.1 30)",
  "oklch(65% 0.1 200)",
  "oklch(70% 0.12 80)",
];

function Avatar({ prenom, index, size = "md" }: { prenom: string; index: number; size?: "sm" | "md" }) {
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const cls = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}
      style={{ backgroundColor: bg }}
    >
      {prenom[0]?.toUpperCase()}
    </div>
  );
}

export default function TableauDeBord() {
  const params = useParams();
  const searchParams = useSearchParams();
  const estNouveau = searchParams.get("nouveau") === "1";

  const [projet, setProjet] = useState<Projet | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [contributeurs, setContributeurs] = useState<Contributeur[]>([]);
  const [enregistrements, setEnregistrements] = useState<Enregistrement[]>([]);
  const [chargement, setChargement] = useState(true);

  const [recEpisodeId, setRecEpisodeId] = useState<string | null>(null);
  const [recEtat, setRecEtat] = useState<RecEtat>("idle");
  const [recDuree, setRecDuree] = useState(0);
  const [recBlob, setRecBlob] = useState<Blob | null>(null);
  const [recUrl, setRecUrl] = useState<string | null>(null);
  const [recEnvoi, setRecEnvoi] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitre, setEditingTitre] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [showAddContrib, setShowAddContrib] = useState(false);
  const [newContrib, setNewContrib] = useState({ prenom: "", email: "" });
  const [addingContrib, setAddingContrib] = useState(false);
  const [addContribErreur, setAddContribErreur] = useState("");

  const [showJingle, setShowJingle] = useState(false);
  const [changingJingle, setChangingJingle] = useState(false);

  // Aperçu & validation
  const [apercuEtats, setApercuEtats] = useState<Record<string, ApercuEtat>>({});
  const [validating, setValidating] = useState<string | null>(null);

  const DUREE_MAX = 5 * 60;

  const charger = useCallback(async () => {
    try {
      const res = await fetch(`/api/projets/${params.id}`);
      const data = await res.json();
      setProjet(data.projet);
      setEpisodes(data.episodes);
      setContributeurs(data.contributeurs);
      setEnregistrements(data.enregistrements || []);
    } finally {
      setChargement(false);
    }
  }, [params.id]);

  useEffect(() => { charger(); }, [charger]);

  const recordedForEpisode = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    episodes.forEach(ep => { map[ep.id] = new Set(); });
    enregistrements.forEach(r => {
      if (r.episode_id && map[r.episode_id]) map[r.episode_id].add(r.contributeur_id);
    });
    return map;
  }, [episodes, enregistrements]);

  const orgContrib = useMemo(
    () => contributeurs.find(c => c.email === projet?.organisateur_email),
    [contributeurs, projet]
  );

  const autresContribs = useMemo(
    () => contributeurs.filter(c => c.email !== projet?.organisateur_email),
    [contributeurs, projet]
  );

  const tousContribs = useMemo(() => {
    const liste = [...autresContribs];
    if (orgContrib) liste.push(orgContrib);
    return liste;
  }, [autresContribs, orgContrib]);

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
        setRecDuree(d => { if (d + 1 >= DUREE_MAX) arreterRec(); return d + 1; });
      }, 1000);
    } catch {
      alert("Impossible d'accéder au microphone.");
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
    if (!recBlob || !projet || !recEpisodeId) return;
    setRecEnvoi(true);
    try {
      const formData = new FormData();
      formData.append("audio", recBlob, "enregistrement.webm");
      formData.append("duree", String(recDuree));
      formData.append("episodeId", recEpisodeId);
      const res = await fetch(`/api/projets/${projet.id}/enregistrement`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      setRecEtat("envoye");
      await charger();
    } catch {
      alert("Erreur lors de l'envoi. Réessayez.");
    } finally {
      setRecEnvoi(false);
    }
  };

  const sauvegarderTitre = async () => {
    if (!editingId || !projet) return;
    setSavingEdit(true);
    await fetch(`/api/projets/${projet.id}/episodes/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titre: editingTitre }),
    });
    setEpisodes(eps => eps.map(e => e.id === editingId ? { ...e, titre: editingTitre } : e));
    setEditingId(null);
    setSavingEdit(false);
  };

  const deplacerEpisode = async (episodeId: string, direction: "up" | "down") => {
    if (!projet) return;
    await fetch(`/api/projets/${projet.id}/episodes/${episodeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    await charger();
  };

  const ajouterContributeur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projet || !newContrib.email) return;
    setAddingContrib(true);
    setAddContribErreur("");
    try {
      const res = await fetch(`/api/projets/${projet.id}/contributeurs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContrib),
      });
      const data = await res.json();
      if (!res.ok) { setAddContribErreur(data.erreur || "Erreur."); return; }
      setNewContrib({ prenom: "", email: "" });
      setShowAddContrib(false);
      await charger();
    } catch {
      setAddContribErreur("Erreur serveur.");
    } finally {
      setAddingContrib(false);
    }
  };

  const changerJingle = async (presetId: string) => {
    if (!projet) return;
    setChangingJingle(true);
    try {
      const formData = new FormData();
      formData.append("jinglePresetId", presetId);
      const res = await fetch(`/api/projets/${projet.id}`, { method: "PATCH", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProjet(p => p ? { ...p, jingle_url: data.jingle_url } : p);
      setShowJingle(false);
    } catch {
      alert("Erreur lors du changement de jingle.");
    } finally {
      setChangingJingle(false);
    }
  };

  const demanderApercu = async (episodeId: string) => {
    if (!projet) return;
    setApercuEtats(s => ({ ...s, [episodeId]: "chargement" }));
    try {
      const res = await fetch(`/api/projets/${projet.id}/episodes/${episodeId}/apercu`, { method: "POST" });
      if (!res.ok) throw new Error();
      // Le service répond immédiatement, le traitement est asynchrone
      // On passe en mode "chargement" — le rechargement interval ou manuel montrera "pret"
      setApercuEtats(s => ({ ...s, [episodeId]: "chargement" }));
      // Poll toutes les 5s pendant 3 minutes max
      const debut = Date.now();
      const poll = setInterval(async () => {
        if (Date.now() - debut > 3 * 60 * 1000) { clearInterval(poll); return; }
        const r = await fetch(`/api/projets/${projet.id}`);
        const d = await r.json();
        const ep = (d.episodes as Episode[]).find(e => e.id === episodeId);
        if (ep?.statut === "monte" && ep?.audio_final_url) {
          clearInterval(poll);
          setEpisodes(d.episodes);
          setApercuEtats(s => ({ ...s, [episodeId]: "pret" }));
        }
      }, 5000);
    } catch {
      alert("Erreur lors du lancement de l'aperçu. Réessayez.");
      setApercuEtats(s => ({ ...s, [episodeId]: "idle" }));
    }
  };

  const validerEpisode = async (episodeId: string) => {
    if (!projet) return;
    setValidating(episodeId);
    try {
      const res = await fetch(`/api/projets/${projet.id}/episodes/${episodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "valider" }),
      });
      if (!res.ok) throw new Error();
      setEpisodes(eps => eps.map(e => e.id === episodeId ? { ...e, statut: "valide" } : e));
      setApercuEtats(s => ({ ...s, [episodeId]: "valide" }));
    } catch {
      alert("Erreur lors de la validation. Réessayez.");
    } finally {
      setValidating(null);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  const statutConfig: Record<string, { label: string; cls: string }> = {
    en_attente: { label: "En attente",  cls: "text-amber-700 bg-amber-50" },
    enregistre: { label: "Enregistré",  cls: "text-blue-700 bg-blue-50" },
    monte:      { label: "Aperçu prêt", cls: "text-purple-700 bg-purple-50" },
    valide:     { label: "Validé",      cls: "text-emerald-700 bg-emerald-50" },
    envoye:     { label: "Envoyé",      cls: "text-green-700 bg-green-50" },
    erreur:     { label: "Erreur",      cls: "text-red-700 bg-red-50" },
  };

  const jingleActuel = JINGLES_PRESETS.find(j => projet?.jingle_url === j.url);

  if (chargement) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="text-ink-muted">Chargement…</p>
    </div>
  );

  if (!projet) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="text-ink-muted">Projet introuvable.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      <nav className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
        <Link href="/" className="font-serif italic text-xl font-medium text-ink">dearly</Link>
        <Link
          href="/projet/nouveau"
          className="text-xs text-ink-muted border border-ink/10 px-4 py-2 rounded-full hover:bg-ink/5 transition-colors"
        >
          Nouveau projet
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pb-16 space-y-4">

        {estNouveau && (
          <div className="rounded-2xl p-4 text-center border" style={{ backgroundColor: "oklch(93% 0.045 70)", borderColor: "oklch(85% 0.07 70)" }}>
            <p className="font-medium text-ink text-sm">Projet créé — les invitations ont été envoyées.</p>
          </div>
        )}

        {/* En-tête projet */}
        <div className="bg-white rounded-3xl border border-ink/6 p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="font-serif text-2xl font-medium text-ink leading-tight">
                Podcast pour {projet.destinataire_prenom}
              </h1>
              <p className="text-ink-muted text-sm mt-1 capitalize">
                {projet.categorie} · {projet.nombre_episodes} épisode{projet.nombre_episodes > 1 ? "s" : ""}
              </p>
            </div>
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 ${
              projet.statut === "actif" ? "bg-green-100 text-green-700" :
              projet.statut === "termine" ? "bg-gray-100 text-gray-600" :
              "bg-amber-100 text-amber-700"
            }`}>
              {projet.statut === "actif" ? "Actif" : projet.statut === "termine" ? "Terminé" : "Brouillon"}
            </span>
          </div>
          <div className="flex gap-8 pt-4 border-t border-ink/5">
            <div>
              <p className="text-2xl font-serif font-medium text-ink">{enregistrements.length}</p>
              <p className="text-xs text-ink-muted mt-0.5">enregistrement{enregistrements.length > 1 ? "s" : ""}</p>
            </div>
            <div>
              <p className="text-2xl font-serif font-medium text-ink">{autresContribs.length}</p>
              <p className="text-xs text-ink-muted mt-0.5">contributeur{autresContribs.length > 1 ? "s" : ""}</p>
            </div>
            {episodes.length > 0 && (
              <div>
                <p className="text-lg font-serif font-medium text-ink">{fmtDate(episodes[0].date_envoi)}</p>
                <p className="text-xs text-ink-muted mt-0.5">1er épisode</p>
              </div>
            )}
          </div>
        </div>

        {/* Matrice */}
        {tousContribs.length > 0 && episodes.length > 0 && (
          <div className="bg-white rounded-3xl border border-ink/6 p-6">
            <h2 className="font-semibold text-ink mb-5">Suivi des contributions</h2>
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full min-w-max">
                <thead>
                  <tr>
                    <th className="text-left pb-3 pr-8" />
                    {episodes.map(ep => (
                      <th key={ep.id} className="pb-3 px-3 text-center">
                        <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide">Ép. {ep.numero}</span>
                      </th>
                    ))}
                    <th className="pb-3 pl-4 text-right">
                      <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide">Total</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/4">
                  {tousContribs.map((c, idx) => {
                    const isOrg = c.email === projet.organisateur_email;
                    const total = episodes.filter(ep => recordedForEpisode[ep.id]?.has(c.id)).length;
                    return (
                      <tr key={c.id}>
                        <td className="py-3 pr-8">
                          <div className="flex items-center gap-2">
                            <Avatar prenom={isOrg ? "V" : c.prenom} index={idx} size="sm" />
                            <span className="text-sm font-medium text-ink">{isOrg ? "Vous" : c.prenom}</span>
                          </div>
                        </td>
                        {episodes.map(ep => {
                          const ok = recordedForEpisode[ep.id]?.has(c.id);
                          return (
                            <td key={ep.id} className="py-3 px-3 text-center">
                              <span
                                className="inline-block w-3.5 h-3.5 rounded-full"
                                style={{ backgroundColor: ok ? "oklch(60% 0.13 50)" : "oklch(88% 0.01 60)" }}
                              />
                            </td>
                          );
                        })}
                        <td className="py-3 pl-4 text-right">
                          <span className="text-xs text-ink-muted font-medium">{total}/{episodes.length}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-ink-muted mt-4 flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "oklch(60% 0.13 50)" }} /> Enregistré
              <span className="inline-block w-2.5 h-2.5 rounded-full ml-2" style={{ backgroundColor: "oklch(88% 0.01 60)" }} /> En attente
            </p>
          </div>
        )}

        {/* Épisodes */}
        <div className="bg-white rounded-3xl border border-ink/6 p-6">
          <h2 className="font-semibold text-ink mb-4">Épisodes</h2>
          <div className="space-y-3">
            {episodes.map((ep, idx) => {
              const s = statutConfig[ep.statut] || { label: ep.statut, cls: "text-gray-600 bg-gray-50" };
              const recsEp = recordedForEpisode[ep.id] ?? new Set<string>();
              const orgAEnregistré = orgContrib ? recsEp.has(orgContrib.id) : false;
              const isRecording = recEpisodeId === ep.id;
              const isEditing = editingId === ep.id;
              const contributeursDeCetEp = contributeurs.filter(c => recsEp.has(c.id));
              const apercuEtat = apercuEtats[ep.id] ?? "idle";
              const peutApercu = recsEp.size > 0 && (ep.statut === "en_attente" || ep.statut === "enregistre");
              const apercuPret = ep.statut === "monte" && !!ep.audio_final_url;
              const estValide = ep.statut === "valide";
              const estEnvoye = ep.statut === "envoye";

              return (
                <div key={ep.id} className="rounded-2xl border border-ink/6 overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    {/* Flèches + numéro */}
                    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => deplacerEpisode(ep.id, "up")}
                        disabled={idx === 0}
                        className="text-ink-muted hover:text-ink disabled:opacity-20 transition-colors"
                        title="Monter"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h6v8h4v-8h6z"/></svg>
                      </button>
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white my-0.5"
                        style={{ backgroundColor: "oklch(60% 0.13 50)" }}
                      >{ep.numero}</span>
                      <button
                        onClick={() => deplacerEpisode(ep.id, "down")}
                        disabled={idx === episodes.length - 1}
                        className="text-ink-muted hover:text-ink disabled:opacity-20 transition-colors"
                        title="Descendre"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8h-6V4H10v8H4z"/></svg>
                      </button>
                    </div>

                    {/* Titre + date */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={editingTitre}
                            onChange={e => setEditingTitre(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") sauvegarderTitre(); if (e.key === "Escape") setEditingId(null); }}
                            className="flex-1 text-sm font-medium text-ink border border-clay/40 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-clay/30 bg-cream min-w-0"
                          />
                          <button onClick={sauvegarderTitre} disabled={savingEdit}
                            className="text-xs bg-ink text-cream px-3 py-1.5 rounded-lg hover:opacity-75 disabled:opacity-40 flex-shrink-0">
                            {savingEdit ? "…" : "OK"}
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="text-xs text-ink-muted px-2 py-1.5 rounded-lg hover:bg-ink/5 flex-shrink-0">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button className="group text-left w-full min-w-0"
                          onClick={() => { setEditingId(ep.id); setEditingTitre(ep.titre); }}>
                          <p className="text-sm font-medium text-ink group-hover:text-clay transition-colors truncate">
                            {ep.titre}
                            <svg className="inline ml-1 opacity-0 group-hover:opacity-40 transition-opacity" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                          </p>
                          <p className="text-xs text-ink-muted mt-0.5">{fmtDate(ep.date_envoi)}</p>
                        </button>
                      )}
                    </div>

                    {/* Statut */}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${s.cls}`}>
                      {s.label}
                    </span>

                    {/* Bouton enregistrer */}
                    <div className="flex-shrink-0">
                      {(orgAEnregistré || (recEtat === "envoye" && isRecording)) ? (
                        <span className="text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full font-medium">Enregistré ✓</span>
                      ) : isRecording ? (
                        <button onClick={resetRec} className="text-xs text-ink-muted border border-ink/10 px-3 py-1.5 rounded-lg hover:bg-ink/5">Fermer</button>
                      ) : (
                        <button onClick={() => demarrerRec(ep.id)} className="text-xs bg-ink text-cream px-3 py-1.5 rounded-lg hover:opacity-75">
                          Enregistrer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contributeurs ayant enregistré */}
                  {contributeursDeCetEp.length > 0 && (
                    <div className="px-4 pb-3 pt-2 border-t border-ink/4 flex items-center gap-1.5">
                      <span className="text-[11px] text-ink-muted mr-1">A enregistré :</span>
                      {contributeursDeCetEp.map((c, i) => (
                        <Avatar key={c.id} prenom={c.email === projet.organisateur_email ? "V" : c.prenom} index={i} size="sm" />
                      ))}
                    </div>
                  )}

                  {/* Bloc aperçu / validation */}
                  {(peutApercu || apercuEtat === "chargement" || apercuPret || estValide) && !estEnvoye && (
                    <div className="border-t border-ink/6 bg-cream px-4 py-4">
                      {apercuEtat === "chargement" && (
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full border-2 border-clay/40 border-t-clay animate-spin flex-shrink-0" />
                          <p className="text-sm text-ink-muted">Montage en cours… revenez dans quelques instants.</p>
                        </div>
                      )}

                      {apercuEtat !== "chargement" && apercuPret && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-ink uppercase tracking-wide">Aperçu avant envoi</p>
                          <audio controls src={ep.audio_final_url!} className="w-full rounded-xl" />
                          <button
                            onClick={() => validerEpisode(ep.id)}
                            disabled={validating === ep.id}
                            className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-40"
                          >
                            {validating === ep.id ? "Validation…" : "Valider l'envoi ✓"}
                          </button>
                        </div>
                      )}

                      {apercuEtat !== "chargement" && !apercuPret && !estValide && peutApercu && (
                        <button
                          onClick={() => demanderApercu(ep.id)}
                          className="w-full border border-ink/12 text-ink-muted text-sm py-2.5 rounded-xl hover:bg-ink/4 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
                          </svg>
                          Assembler l&apos;aperçu
                        </button>
                      )}

                      {estValide && (
                        <div className="flex items-center gap-2 text-emerald-700">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <p className="text-sm font-medium">Validé — sera envoyé à la date prévue.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recorder inline */}
                  {isRecording && recEtat !== "envoye" && (
                    <div className="border-t border-ink/6 bg-cream px-4 py-5">
                      {recEtat === "idle" && (
                        <div className="text-center py-2">
                          <button onClick={() => demarrerRec(ep.id)}
                            className="w-16 h-16 rounded-full bg-red-500 text-white text-2xl hover:bg-red-400 active:scale-95 transition-all shadow-md mx-auto flex items-center justify-center">
                            🎙️
                          </button>
                          <p className="text-ink-muted text-xs mt-3">Appuyez pour commencer</p>
                        </div>
                      )}
                      {recEtat === "enregistrement" && (
                        <div className="text-center py-2">
                          <div className="relative w-16 h-16 mx-auto mb-3">
                            <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-75" />
                            <button onClick={arreterRec}
                              className="relative w-16 h-16 rounded-full bg-red-500 text-white text-2xl hover:bg-red-400 shadow-md flex items-center justify-center">
                              ⏹
                            </button>
                          </div>
                          <p className="text-2xl font-mono font-bold text-ink">{fmt(recDuree)}</p>
                          <p className="text-xs text-ink-muted mt-1">Appuyez pour arrêter</p>
                        </div>
                      )}
                      {recEtat === "termine" && recUrl && (
                        <div>
                          <audio controls src={recUrl} className="w-full mb-3 rounded-xl" />
                          <div className="flex gap-2">
                            <button onClick={resetRec}
                              className="flex-1 border border-ink/10 text-ink-muted py-2.5 rounded-xl text-sm hover:bg-ink/5">
                              Recommencer
                            </button>
                            <button onClick={envoyerRec} disabled={recEnvoi}
                              className="flex-1 bg-ink text-cream py-2.5 rounded-xl text-sm font-medium hover:opacity-75 disabled:opacity-40">
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

        {/* Contributeurs */}
        <div className="bg-white rounded-3xl border border-ink/6 p-6">
          <h2 className="font-semibold text-ink mb-4">Contributeurs</h2>
          <div className="space-y-0">
            {autresContribs.map((c, idx) => {
              const total = episodes.filter(ep => recordedForEpisode[ep.id]?.has(c.id)).length;
              return (
                <div key={c.id} className="flex items-center gap-3 py-3 border-b border-ink/4 last:border-0">
                  <Avatar prenom={c.prenom} index={idx} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{c.prenom}</p>
                    <p className="text-xs text-ink-muted truncate">{c.email}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {episodes.map(ep => (
                      <span key={ep.id} className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: recordedForEpisode[ep.id]?.has(c.id) ? "oklch(60% 0.13 50)" : "oklch(88% 0.01 60)" }} />
                    ))}
                    <span className="text-[11px] text-ink-muted ml-1.5">{total}/{episodes.length}</span>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/contribuer/${c.token}`); alert("Lien copié !"); }}
                    className="text-xs text-ink-muted border border-ink/10 px-3 py-1.5 rounded-lg hover:bg-ink/5 flex-shrink-0">
                    Copier le lien
                  </button>
                </div>
              );
            })}
          </div>

          {showAddContrib ? (
            <form onSubmit={ajouterContributeur} className="mt-4 pt-4 border-t border-ink/6 space-y-3">
              <p className="text-sm font-medium text-ink">Ajouter un contributeur</p>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Prénom" value={newContrib.prenom}
                  onChange={e => setNewContrib(n => ({ ...n, prenom: e.target.value }))}
                  className="border border-ink/10 rounded-xl px-3 py-2.5 text-sm text-ink placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-clay/30 focus:border-clay bg-cream" />
                <input type="email" placeholder="Email" value={newContrib.email}
                  onChange={e => setNewContrib(n => ({ ...n, email: e.target.value }))}
                  required
                  className="border border-ink/10 rounded-xl px-3 py-2.5 text-sm text-ink placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-clay/30 focus:border-clay bg-cream" />
              </div>
              {addContribErreur && <p className="text-red-600 text-xs">{addContribErreur}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowAddContrib(false); setAddContribErreur(""); }}
                  className="flex-1 border border-ink/10 text-ink-muted py-2.5 rounded-xl text-sm hover:bg-ink/5">
                  Annuler
                </button>
                <button type="submit" disabled={addingContrib}
                  className="flex-1 bg-ink text-cream py-2.5 rounded-xl text-sm font-medium hover:opacity-75 disabled:opacity-40">
                  {addingContrib ? "Envoi…" : "Inviter"}
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowAddContrib(true)}
              className="mt-4 w-full border border-dashed border-ink/15 text-ink-muted text-sm py-3 rounded-xl hover:bg-ink/4 hover:border-ink/25 transition-all">
              + Ajouter un contributeur
            </button>
          )}
        </div>

        {/* Réglages */}
        <div className="bg-white rounded-3xl border border-ink/6 p-6">
          <h2 className="font-semibold text-ink mb-4">Réglages</h2>
          <div className="flex items-center justify-between py-3 border-b border-ink/4">
            <div>
              <p className="text-sm font-medium text-ink">Jingle</p>
              <p className="text-xs text-ink-muted mt-0.5">
                {jingleActuel ? `${jingleActuel.emoji} ${jingleActuel.nom} — ${jingleActuel.description}` : "Jingle personnalisé"}
              </p>
            </div>
            <button onClick={() => setShowJingle(!showJingle)}
              className="text-xs text-ink-muted border border-ink/10 px-3 py-1.5 rounded-lg hover:bg-ink/5">
              Changer
            </button>
          </div>
          {showJingle && (
            <div className="mt-4 space-y-2">
              {JINGLES_PRESETS.map(j => (
                <button key={j.id} onClick={() => changerJingle(j.id)} disabled={changingJingle}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                    jingleActuel?.id === j.id ? "border-clay/40 bg-clay-light" : "border-ink/8 hover:bg-ink/4"
                  }`}>
                  <span className="text-xl">{j.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{j.nom}</p>
                    <p className="text-xs text-ink-muted">{j.description}</p>
                  </div>
                  {jingleActuel?.id === j.id && <span className="text-xs text-clay font-medium">Actuel</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-ink-muted pt-2 pb-4">
          Vous avez perdu ce lien ?{" "}
          <Link href="/retrouver" className="underline hover:text-ink transition-colors">
            Retrouvez votre tableau de bord par email
          </Link>
        </p>

      </div>
    </div>
  );
}
