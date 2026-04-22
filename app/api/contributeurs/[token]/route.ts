import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = supabaseAdmin();

    const { data: contributeur, error } = await supabase
      .from("contributeurs")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !contributeur) {
      return NextResponse.json({ erreur: "Lien invalide." }, { status: 404 });
    }

    const { data: projet } = await supabase
      .from("projets")
      .select("*")
      .eq("id", contributeur.projet_id)
      .single();

    return NextResponse.json({ contributeur, projet });
  } catch (error) {
    console.error("Erreur GET contributeur:", error);
    return NextResponse.json({ erreur: "Erreur serveur." }, { status: 500 });
  }
}
