import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
  try {
    const { id: projetId, episodeId } = await params;
    const supabase = supabaseAdmin();
    const body = await req.json();

    // Cas 1 : modifier le titre
    if (body.titre !== undefined) {
      const { error } = await supabase
        .from("episodes")
        .update({ titre: body.titre })
        .eq("id", episodeId)
        .eq("projet_id", projetId);

      if (error) throw error;
      return NextResponse.json({ succes: true });
    }

    // Cas 2 : déplacer l'épisode (haut ou bas)
    if (body.direction === "up" || body.direction === "down") {
      const { data: episodes, error: errEp } = await supabase
        .from("episodes")
        .select("id, numero, date_envoi")
        .eq("projet_id", projetId)
        .order("numero");

      if (errEp || !episodes) throw new Error("Épisodes introuvables.");

      const idx = episodes.findIndex(e => e.id === episodeId);
      if (idx === -1) return NextResponse.json({ erreur: "Épisode introuvable." }, { status: 404 });

      const swapIdx = body.direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= episodes.length) {
        return NextResponse.json({ erreur: "Impossible de déplacer dans cette direction." }, { status: 400 });
      }

      const ep1 = episodes[idx];
      const ep2 = episodes[swapIdx];

      // Échanger les numéros et les dates
      await Promise.all([
        supabase.from("episodes").update({ numero: ep2.numero, date_envoi: ep2.date_envoi }).eq("id", ep1.id),
        supabase.from("episodes").update({ numero: ep1.numero, date_envoi: ep1.date_envoi }).eq("id", ep2.id),
      ]);

      return NextResponse.json({ succes: true });
    }

    return NextResponse.json({ erreur: "Action invalide." }, { status: 400 });
  } catch (error) {
    console.error("Erreur PATCH épisode:", error);
    return NextResponse.json({ erreur: "Erreur serveur." }, { status: 500 });
  }
}
