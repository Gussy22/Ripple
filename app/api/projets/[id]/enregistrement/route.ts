import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projetId } = await params;
    const supabase = supabaseAdmin();
    const formData = await req.formData();

    const audioFile = formData.get("audio") as File;
    const duree = Number(formData.get("duree") || 0);
    const episodeIdForcé = (formData.get("episodeId") as string | null) || null;

    if (!audioFile) {
      return NextResponse.json({ erreur: "Fichier audio manquant." }, { status: 400 });
    }

    // Récupérer le projet
    const { data: projet, error: errProjet } = await supabase
      .from("projets")
      .select("*")
      .eq("id", projetId)
      .single();

    if (errProjet || !projet) {
      return NextResponse.json({ erreur: "Projet introuvable." }, { status: 404 });
    }

    // Créer ou récupérer le contributeur "organisateur"
    let { data: contributeur } = await supabase
      .from("contributeurs")
      .select("*")
      .eq("projet_id", projetId)
      .eq("email", projet.organisateur_email)
      .single();

    if (!contributeur) {
      const { data: nouveau } = await supabase
        .from("contributeurs")
        .insert({
          projet_id: projetId,
          email: projet.organisateur_email,
          prenom: "L'organisateur",
          token: crypto.randomUUID(),
        })
        .select()
        .single();
      contributeur = nouveau;
    }

    if (!contributeur) {
      return NextResponse.json({ erreur: "Impossible de créer le contributeur." }, { status: 500 });
    }

    // Upload de l'audio
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const nomFichier = `enregistrements/${projetId}/${crypto.randomUUID()}.webm`;

    const { error: errUpload } = await supabase.storage
      .from("audio")
      .upload(nomFichier, buffer, { contentType: "audio/webm" });

    if (errUpload) throw errUpload;

    const { data: urlData } = supabase.storage.from("audio").getPublicUrl(nomFichier);

    // Assigner à l'épisode : soit celui demandé, soit round-robin
    let episodeId: string | null = episodeIdForcé;

    if (!episodeId) {
      const { data: episodes } = await supabase
        .from("episodes")
        .select("id, numero")
        .eq("projet_id", projetId)
        .order("numero");

      if (episodes && episodes.length > 0) {
        const { data: comptages } = await supabase
          .from("enregistrements")
          .select("episode_id")
          .eq("projet_id", projetId);

        const compte: Record<string, number> = {};
        episodes.forEach((ep) => { compte[ep.id] = 0; });
        (comptages || []).forEach((e) => {
          if (e.episode_id) compte[e.episode_id] = (compte[e.episode_id] || 0) + 1;
        });

        episodeId = episodes.reduce((min, ep) =>
          compte[ep.id] < compte[min] ? ep.id : min,
          episodes[0].id
        );
      }
    }

    // Sauvegarder l'enregistrement
    await supabase.from("enregistrements").insert({
      contributeur_id: contributeur.id,
      projet_id: projetId,
      episode_id: episodeId,
      audio_url: urlData.publicUrl,
      duree_secondes: duree,
    });

    if (episodeId) {
      await supabase
        .from("episodes")
        .update({ statut: "enregistre" })
        .eq("id", episodeId);
    }

    return NextResponse.json({ succes: true });
  } catch (error) {
    console.error("Erreur enregistrement organisateur:", error);
    return NextResponse.json({ erreur: "Erreur serveur." }, { status: 500 });
  }
}
