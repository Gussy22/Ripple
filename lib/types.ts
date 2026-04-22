export type Categorie =
  | 'anniversaire'
  | 'mariage'
  | 'retraite'
  | 'naissance'
  | 'depart'
  | 'autre'

export type StatutProjet = 'brouillon' | 'actif' | 'termine'
export type StatutEpisode = 'en_attente' | 'enregistre' | 'monte' | 'envoye'

export interface Projet {
  id: string
  nom: string
  categorie: Categorie
  organisateur_email: string
  destinataire_email: string
  destinataire_prenom: string
  nombre_episodes: number
  jingle_url: string | null
  statut: StatutProjet
  date_debut: string
  created_at: string
}

export interface Episode {
  id: string
  projet_id: string
  titre: string
  numero: number
  date_envoi: string
  statut: StatutEpisode
  audio_final_url: string | null
  created_at: string
}

export interface Contributeur {
  id: string
  projet_id: string
  email: string
  prenom: string
  token: string
  created_at: string
}

export interface Enregistrement {
  id: string
  contributeur_id: string
  episode_id: string
  audio_url: string
  duree_secondes: number
  created_at: string
}
