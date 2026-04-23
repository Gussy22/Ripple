"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Categorie } from "@/lib/types";
import { TITRES_PAR_CATEGORIE } from "@/lib/titres-suggestions";

const CATEGORIES: { valeur: Categorie; label: string; emoji: string }[] = [
  { valeur: "anniversaire", label: "Anniversaire", emoji: "🎂" },
  { valeur: "mariage", label: "Mariage", emoji: "💍" },
  { valeur: "retraite", label: "Retraite", emoji: "🌅" },
  { valeur: "naissance", label: "Naissance", emoji: "👶" },
  { valeur: "depart", label: "Départ / Au revoir", emoji: "✈️" },
  { valeur: "autre", label: "Autre occasion", emoji: "🎉" },
];

type Etape = 1 | 2 | 3 | 4;

export default function NouveauProjet() {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>(1);
  const [chargement, setChargement] = useState(false);

  // Données du formulaire
  const [categorie, setCategorie] = useState<Categorie | null>(null);
  const [destinatairePrenom, setDestinatairePrenom] = useState("");
  const [destinataireEmail, setDestinataireEmail] = useState("");
  const [organisateurEmail, setOrganisateurEmail] = useState("");
  const [nombreEpisodes, setNombreEpisodes] = useState(4);
  const [dateDebut, setDateDebut] = useState("");
  const [titresEpisodes, setTitresEpisodes] = useState<string[]>([]);
  const [contributeurs, setContributeurs] = useState([{ prenom: "", email: "" }]);
  const [jingleFile, setJingleFile] = useState<File | null>(null);
  const [erreur, setErreur] = useState("");

  // Étape 1 : Catégorie + destinataire
  const validerEtape1 = () => {
    if (!categorie) return setErreur("Choisissez une catégorie.");
    if (!destinatairePrenom.trim()) return setErreur("Entrez le prénom du destinataire.");
    if (!destinataireEmail.trim()) return setErreur("Entrez l'email du destinataire.");
    if (!organisateurEmail.trim()) return setErreur("Entrez votre email.");
    if (!dateDebut) return setErreur("Choisissez une date de début.");
    setErreur("");
    // Préparer les titres vides à remplir manuellement
    setTitresEpisodes(Array.from({ length: nombreEpisodes }, () => ""));
    setEtape(2);
  };

  const ajouterContributeur = () => {
    setContributeurs([...contributeurs, { prenom: "", email: "" }]);
  };

  const supprimerContributeur = (index: number) => {
    setContributeurs(contributeurs.filter((_, i) => i !== index));
  };

  const mettreAJourContributeur = (index: number, champ: "prenom" | "email", valeur: string) => {
    const copie = [...contributeurs];
    copie[index][champ] = valeur;
    setContributeurs(copie);
  };

  const soumettre = async () => {
    setChargement(true);
    setErreur("");
    try {
      const formData = new FormData();
      formData.append("categorie", categorie!);
      formData.append("destinatairePrenom", destinatairePrenom);
      formData.append("destinataireEmail", destinataireEmail);
      formData.append("organisateurEmail", organisateurEmail);
      formData.append("nombreEpisodes", String(nombreEpisodes));
      formData.append("dateDebut", dateDebut);
      formData.append("titresEpisodes", JSON.stringify(titresEpisodes));
      formData.append("contributeurs", JSON.stringify(contributeurs.filter(c => c.email.trim())));
      if (jingleFile) formData.append("jingle", jingleFile);

      const res = await fetch("/api/projets", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur lors de la création du projet.");

      const { id } = await res.json();
      router.push(`/projet/${id}?nouveau=1`);
    } catch (e: unknown) {
      setErreur(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-10">
          <a href="/" className="text-2xl font-bold text-gray-900">dearly</a>
          <p className="text-gray-500 mt-2">Nouveau projet</p>
        </div>

        {/* Indicateur d'étape */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                etape === n ? "bg-gray-900 text-white" :
                etape > n ? "bg-green-500 text-white" :
                "bg-gray-200 text-gray-500"
              }`}>
                {etape > n ? "✓" : n}
              </div>
              {n < 4 && <div className={`w-8 h-px ${etape > n ? "bg-green-500" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

          {/* ÉTAPE 1 : L'occasion */}
          {etape === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">L&apos;occasion</h2>
              <p className="text-gray-500 text-sm mb-6">Pour qui et pour quelle occasion créez-vous ce podcast ?</p>

              <label className="block text-sm font-medium text-gray-700 mb-3">Catégorie</label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.valeur}
                    onClick={() => setCategorie(cat.valeur)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      categorie === cat.valeur
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xl mr-2">{cat.emoji}</span>
                    <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom du destinataire</label>
                  <input
                    type="text"
                    value={destinatairePrenom}
                    onChange={(e) => setDestinatairePrenom(e.target.value)}
                    placeholder="Marie"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Son email</label>
                  <input
                    type="email"
                    value={destinataireEmail}
                    onChange={(e) => setDestinataireEmail(e.target.value)}
                    placeholder="marie@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Votre email (organisateur)</label>
                <input
                  type="email"
                  value={organisateurEmail}
                  onChange={(e) => setOrganisateurEmail(e.target.value)}
                  placeholder="vous@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d&apos;épisodes</label>
                  <select
                    value={nombreEpisodes}
                    onChange={(e) => setNombreEpisodes(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    {[2, 3, 4, 5, 6, 8, 10].map(n => (
                      <option key={n} value={n}>{n} épisodes</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date du 1er épisode</label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              {erreur && <p className="text-red-500 text-sm mb-4">{erreur}</p>}

              <button
                onClick={validerEtape1}
                disabled={chargement}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Continuer →
              </button>
            </div>
          )}

          {/* ÉTAPE 2 : Titres des épisodes */}
          {etape === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Titres des épisodes</h2>
              <p className="text-gray-500 text-sm mb-4">
                Choisissez {nombreEpisodes} titres parmi nos suggestions, ou écrivez les vôtres.
              </p>

              {/* Suggestions cliquables */}
              {categorie && (
                <div className="mb-5">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {TITRES_PAR_CATEGORIE[categorie].map((suggestion) => {
                      const dejaChoisi = titresEpisodes.includes(suggestion);
                      const complet = titresEpisodes.filter(Boolean).length >= nombreEpisodes && !dejaChoisi;
                      return (
                        <button
                          key={suggestion}
                          disabled={complet}
                          onClick={() => {
                            if (dejaChoisi) {
                              setTitresEpisodes(titresEpisodes.filter((t) => t !== suggestion));
                            } else {
                              const vide = titresEpisodes.findIndex((t) => !t.trim());
                              if (vide !== -1) {
                                const copie = [...titresEpisodes];
                                copie[vide] = suggestion;
                                setTitresEpisodes(copie);
                              }
                            }
                          }}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            dejaChoisi
                              ? "bg-gray-900 text-white border-gray-900"
                              : complet
                              ? "border-gray-100 text-gray-300 cursor-not-allowed"
                              : "border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900"
                          }`}
                        >
                          {dejaChoisi && "✓ "}{suggestion}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Épisodes sélectionnés / à remplir */}
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Vos épisodes ({titresEpisodes.filter(Boolean).length}/{nombreEpisodes})
              </p>
              <div className="space-y-2 mb-6">
                {titresEpisodes.map((titre, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={titre}
                      placeholder="Choisissez ou écrivez un titre…"
                      onChange={(e) => {
                        const copie = [...titresEpisodes];
                        copie[i] = e.target.value;
                        setTitresEpisodes(copie);
                      }}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    {titre && (
                      <button
                        onClick={() => {
                          const copie = [...titresEpisodes];
                          copie[i] = "";
                          setTitresEpisodes(copie);
                        }}
                        className="text-gray-300 hover:text-gray-500 transition-colors text-lg shrink-0"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {erreur && <p className="text-red-500 text-sm mb-4">{erreur}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setEtape(1)}
                  className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  ← Retour
                </button>
                <button
                  onClick={() => {
                    if (titresEpisodes.filter(Boolean).length < nombreEpisodes) {
                      return setErreur(`Remplissez les ${nombreEpisodes} titres avant de continuer.`);
                    }
                    setErreur("");
                    setEtape(3);
                  }}
                  className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : Contributeurs */}
          {etape === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Les contributeurs</h2>
              <p className="text-gray-500 text-sm mb-6">Ils recevront un lien pour enregistrer leur message vocal.</p>

              <div className="space-y-3 mb-4">
                {contributeurs.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={c.prenom}
                      onChange={(e) => mettreAJourContributeur(i, "prenom", e.target.value)}
                      placeholder="Prénom"
                      className="w-1/3 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <input
                      type="email"
                      value={c.email}
                      onChange={(e) => mettreAJourContributeur(i, "email", e.target.value)}
                      placeholder="email@exemple.com"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    {contributeurs.length > 1 && (
                      <button
                        onClick={() => supprimerContributeur(i)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors shrink-0"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={ajouterContributeur}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
              >
                + Ajouter un contributeur
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setEtape(2)}
                  className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  ← Retour
                </button>
                <button
                  onClick={() => setEtape(4)}
                  className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : Jingle + récapitulatif */}
          {etape === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Le jingle</h2>
              <p className="text-gray-500 text-sm mb-6">
                Uploadez un fichier audio MP3 ou WAV (5 à 30 secondes idéalement).
                Il sera joué en intro et entre chaque message vocal.
              </p>

              <div className="mb-6">
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
                  jingleFile ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                }`}>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => setJingleFile(e.target.files?.[0] || null)}
                  />
                  {jingleFile ? (
                    <div className="text-center">
                      <p className="text-green-600 font-medium">✓ {jingleFile.name}</p>
                      <p className="text-sm text-gray-500 mt-1">Cliquez pour changer</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-400 text-3xl mb-2">🎵</p>
                      <p className="text-sm text-gray-500">Cliquez pour choisir un fichier audio</p>
                      <p className="text-xs text-gray-400 mt-1">MP3, WAV, M4A acceptés</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Récapitulatif */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-sm">
                <p className="font-medium text-gray-700 mb-2">Récapitulatif</p>
                <ul className="space-y-1 text-gray-500">
                  <li>🎯 Destinataire : <span className="text-gray-800">{destinatairePrenom}</span></li>
                  <li>📅 {nombreEpisodes} épisodes à partir du <span className="text-gray-800">{dateDebut ? new Date(dateDebut).toLocaleDateString("fr-FR") : "—"}</span></li>
                  <li>👥 {contributeurs.filter(c => c.email.trim()).length} contributeur(s)</li>
                </ul>
              </div>

              {erreur && <p className="text-red-500 text-sm mb-4">{erreur}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setEtape(3)}
                  className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  ← Retour
                </button>
                <button
                  onClick={soumettre}
                  disabled={chargement}
                  className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {chargement ? "Création en cours…" : "Lancer le projet 🚀"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
