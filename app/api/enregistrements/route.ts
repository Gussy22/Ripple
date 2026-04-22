import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseAdmin();
    const formData = await req.formData();

    const audioFile = formData.get("audio") as File;
    const token = formData.get("token") as string;
    const duree = Number(formData.get("duree") || 0);

    if (!audioFile || !token) {
      return NextResponse.json({ erreur: "Données manquantes." }, { status: 400 });
    }

    // Récupérer le contributeur
    const { data: contributeur, error: errContrib } = await supabase
      .from("contributeurs")
      .select("*")
      .eq("token", token)
      .single();

    if (errContrib || !contributeur) {
      return NextResponse.json({ erreur: "Contributeur introuvable." }, { status: 404 });
    }

    // Upload de l'audio
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const nomFichier = `enregistrements/${contributeur.projet_id}/${crypto.randomUUID()}.webm`;

    const { error: errUpload } = await supabase.storage
      .from("audio")
      .upload(nomFichier, buffer, { contentType: "audio/webm" });

    if (errUpload) throw errUpload;

    const { data: urlData } = supabase.storage.from("audio").getPublicUrl(nomFichier);

    // Assigner à l'épisode qui a le moins d'enregistrements (tourniquet)
    const { data: episodes } = await supabase
      .from("episodes")
      .select("id, numero")
      .eq("projet_id", contributeur.projet_id)
      .order("numero");

    let episodeId: string | null = null;

    if (episodes && episodes.length > 0) {
      // Compter les enregistrements par épisode
      const { data: comptages } = await supabase
        .from("enregistrements")
        .select("episode_id")
        .eq("projet_id", contributeur.projet_id);

      const compte: Record<string, number> = {};
      episodes.forEach((ep) => { compte[ep.id] = 0; });
      (comptages || []).forEach((e) => {
        if (e.episode_id) compte[e.episode_id] = (compte[e.episode_id] || 0) + 1;
      });

      // Choisir l'épisode avec le moins d'enregistrements
      episodeId = episodes.reduce((min, ep) =>
        compte[ep.id] < compte[min] ? ep.id : min,
        episodes[0].id
      );
    }

    // Sauvegarder l'enregistrement en base
    await supabase.from("enregistrements").insert({
      contributeur_id: contributeur.id,
      projet_id: contributeur.projet_id,
      episode_id: episodeId,
      audio_url: urlData.publicUrl,
      duree_secondes: duree,
    });

    // Mettre à jour le statut de l'épisode
    if (episodeId) {
      await supabase
        .from("episodes")
        .update({ statut: "enregistre" })
        .eq("id", episodeId);
    }

    return NextResponse.json({ succes: true });
  } catch (error) {
    console.error("Erreur enregistrement:", error);
    return NextResponse.json({ erreur: "Erreur lors de l'upload." }, { status: 500 });
  }
}
