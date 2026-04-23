const SUPABASE_URL = "https://gjmktovbrzyuefemnsfq.supabase.co/storage/v1/object/public/audio/jingles-presets";

export const JINGLES_PRESETS = [
  {
    id: "jingle-1",
    nom: "Douceur",
    description: "Piano doux et chaleureux",
    emoji: "🎹",
    url: `${SUPABASE_URL}/Jingle-1.mp3`,
  },
  {
    id: "jingle-2",
    nom: "Lumière",
    description: "Guitare acoustique apaisante",
    emoji: "🎸",
    url: `${SUPABASE_URL}/Jingle-2.mp3`,
  },
  {
    id: "jingle-3",
    nom: "Sérénité",
    description: "Ambiance douce et intime",
    emoji: "✨",
    url: `${SUPABASE_URL}/Jingle-3.mp3`,
  },
];
