import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = supabaseAdmin();

    const [projetRes, episodesRes, contributeursRes] = await Promise.all([
      supabase.from("projets").select("*").eq("id", id).single(),
      supabase.from("episodes").select("*").eq("projet_id", id).order("numero"),
      supabase.from("contributeurs").select("*").eq("projet_id", id),
    ]);

    if (projetRes.error || !projetRes.data) {
      return NextResponse.json({ erreur: "Projet introuvable." }, { status: 404 });
    }

    return NextResponse.json({
      projet: projetRes.data,
      episodes: episodesRes.data || [],
      contributeurs: contributeursRes.data || [],
    });
  } catch (error) {
    console.error("Erreur GET projet:", error);
    return NextResponse.json({ erreur: "Erreur serveur." }, { status: 500 });
  }
}
