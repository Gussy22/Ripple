-- Schéma base de données Ripple
-- À exécuter dans l'éditeur SQL de Supabase

-- Table des projets
create table projets (
  id uuid default gen_random_uuid() primary key,
  categorie text not null,
  destinataire_prenom text not null,
  destinataire_email text not null,
  organisateur_email text not null,
  nombre_episodes integer not null default 4,
  jingle_url text,
  statut text not null default 'actif',
  date_debut date not null,
  created_at timestamptz default now()
);

-- Table des épisodes
create table episodes (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  titre text not null,
  numero integer not null,
  date_envoi date not null,
  statut text not null default 'en_attente',
  audio_final_url text,
  created_at timestamptz default now()
);

-- Table des contributeurs
create table contributeurs (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  email text not null,
  prenom text not null,
  token uuid default gen_random_uuid() unique not null,
  created_at timestamptz default now()
);

-- Table des enregistrements
create table enregistrements (
  id uuid default gen_random_uuid() primary key,
  contributeur_id uuid references contributeurs(id) on delete cascade,
  projet_id uuid references projets(id) on delete cascade,
  audio_url text not null,
  duree_secondes integer,
  created_at timestamptz default now()
);

-- Accès public en lecture pour les contributeurs (via token)
alter table projets enable row level security;
alter table episodes enable row level security;
alter table contributeurs enable row level security;
alter table enregistrements enable row level security;

-- Politique : accès total via service role (notre backend)
create policy "Service role full access projets"
  on projets for all using (true);
create policy "Service role full access episodes"
  on episodes for all using (true);
create policy "Service role full access contributeurs"
  on contributeurs for all using (true);
create policy "Service role full access enregistrements"
  on enregistrements for all using (true);
