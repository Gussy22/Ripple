import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
  try {
    const { id: projetId, episodeId } = await params;
    const supabase = supabaseAdmin();

    // Vérifier que l'épisode appartient bien à ce projet
    const { data: episode, error } = await supabase
      .from("episodes")
      .select("id, statut")
      .eq("id", episodeId)
      .eq("projet_id", projetId)
      .single();

    if (error || !episode) {
      return NextResponse.json({ erreur: "Épisode introuvable." }, { status: 404 });
    }

    // Ne pas relancer si déjà monté ou validé
    if (episode.statut === "valide" || episode.statut === "envoye") {
      return NextResponse.json({ erreur: "Épisode déjà traité." }, { status: 400 });
    }

    // Appeler le service audio Render en mode aperçu (fire-and-forget)
    const serviceAudioUrl = process.env.RENDER_SERVICE_URL;
    const serviceSecret = process.env.SERVICE_SECRET;

    const res = await fetch(`${serviceAudioUrl}/traiter-episode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-secret": serviceSecret || "",
      },
      body: JSON.stringify({ episodeId, preview: true }),
    });

    if (!res.ok) {
      return NextResponse.json({ erreur: "Erreur service audio." }, { status: 502 });
    }

    return NextResponse.json({ succes: true });
  } catch (error) {
    console.error("Erreur aperçu épisode:", error);
    return NextResponse.json({ erreur: "Erreur serveur." }, { status: 500 });
  }
}
