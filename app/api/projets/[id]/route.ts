import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { JINGLES_PRESETS } from "@/lib/jingles-presets";
import crypto from "crypto";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = supabaseAdmin();

    const [projetRes, episodesRes, contributeursRes, enregistrementsRes] = await Promise.all([
      supabase.from("projets").select("*").eq("id", id).single(),
      supabase.from("episodes").select("*").eq("projet_id", id).order("numero"),
      supabase.from("contributeurs").select("*").eq("projet_id", id),
      supabase.from("enregistrements").select("*").eq("projet_id", id),
    ]);

    if (projetRes.error || !projetRes.data) {
      return NextResponse.json({ erreur: "Projet introuvable." }, { status: 404 });
    }

    return NextResponse.json({
      projet: projetRes.data,
      episodes: episodesRes.data || [],
      contributeurs: contributeursRes.data || [],
      enregistrements: enregistrementsRes.data || [],
    });
  } catch (error) {
    console.error("Erreur GET projet:", error);
    return NextResponse.json({ erreur: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = supabaseAdmin();
    const formData = await req.formData();

    const jinglePresetId = formData.get("jinglePresetId") as string | null;
    const jingleFile = formData.get("jingle") as File | null;

    let jingleUrl: string | null = null;

    if (jinglePresetId) {
      const preset = JINGLES_PRESETS.find(j => j.id === jinglePresetId);
      if (preset) jingleUrl = preset.url;
    } else if (jingleFile && jingleFile.size > 0) {
      const buffer = Buffer.from(await jingleFile.arrayBuffer());
      const nomFichier = `jingles/${crypto.randomUUID()}-${jingleFile.name}`;
      const { error } = await supabase.storage
        .from("audio")
        .upload(nomFichier, buffer, { contentType: jingleFile.type });
      if (!error) {
        const { data } = supabase.storage.from("audio").getPublicUrl(nomFichier);
        jingleUrl = data.publicUrl;
      }
    }

    if (!jingleUrl) {
      return NextResponse.json({ erreur: "Jingle invalide." }, { status: 400 });
    }

    const { error } = await supabase
      .from("projets")
      .update({ jingle_url: jingleUrl })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ succes: true, jingle_url: jingleUrl });
  } catch (error) {
    console.error("Erreur PATCH projet:", error);
    return NextResponse.json({ erreur: "Erreur serveur." }, { status: 500 });
  }
}
