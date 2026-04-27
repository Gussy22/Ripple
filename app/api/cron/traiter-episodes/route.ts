import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Cette route est appelée automatiquement chaque matin à 9h par Vercel Cron
// Elle trouve les épisodes du jour et les envoie au service audio Render

export async function GET(req: NextRequest) {
  // Vérifier que l'appel vient bien de Vercel Cron
  const authorization = req.headers.get("authorization");
  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erreur: "Non autorisé." }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const aujourdhui = new Date().toISOString().split("T")[0];

  // Trouver tous les épisodes à envoyer aujourd'hui (statut pas encore envoyé)
  const { data: episodes, error } = await supabase
    .from("episodes")
    .select("id, numero, titre, projet_id")
    .eq("date_envoi", aujourdhui)
    .eq("statut", "valide");

  if (error) {
    console.error("Erreur récupération épisodes:", error);
    return NextResponse.json({ erreur: "Erreur base de données." }, { status: 500 });
  }

  if (!episodes || episodes.length === 0) {
    console.log(`Aucun épisode à envoyer aujourd'hui (${aujourdhui})`);
    return NextResponse.json({ message: "Aucun épisode aujourd'hui.", date: aujourdhui });
  }

  console.log(`${episodes.length} épisode(s) à traiter pour le ${aujourdhui}`);

  const serviceAudioUrl = process.env.RENDER_SERVICE_URL;
  const serviceSecret = process.env.SERVICE_SECRET;

  const resultats = [];

  for (const episode of episodes) {
    try {
      // Appeler le service audio Render (fire-and-forget)
      const res = await fetch(`${serviceAudioUrl}/traiter-episode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-service-secret": serviceSecret || "",
        },
        body: JSON.stringify({ episodeId: episode.id }),
      });

      if (res.ok) {
        resultats.push({ id: episode.id, statut: "déclenché" });
      } else {
        resultats.push({ id: episode.id, statut: "erreur_appel" });
      }
    } catch (err) {
      console.error(`Erreur pour l'épisode ${episode.id}:`, err);
      resultats.push({ id: episode.id, statut: "erreur" });
    }
  }

  return NextResponse.json({ date: aujourdhui, episodes: resultats });
}
