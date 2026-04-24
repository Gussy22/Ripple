import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifierCookieSession, COOKIE_NAME } from "@/lib/session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    const email = cookie ? verifierCookieSession(cookie) : null;

    if (!email) {
      return NextResponse.json({ erreur: "Non connecté." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = supabaseAdmin();

    // Vérifier que le projet appartient bien à cet organisateur
    const { data: projet, error } = await supabase
      .from("projets")
      .select("id, organisateur_email")
      .eq("id", id)
      .eq("organisateur_email", email)
      .single();

    if (error || !projet) {
      return NextResponse.json({ erreur: "Projet introuvable." }, { status: 404 });
    }

    // Supprimer dans l'ordre (contraintes de clé étrangère)
    await supabase.from("enregistrements").delete().eq("projet_id", id);
    await supabase.from("episodes").delete().eq("projet_id", id);
    await supabase.from("contributeurs").delete().eq("projet_id", id);
    await supabase.from("projets").delete().eq("id", id);

    return NextResponse.json({ succes: true });
  } catch (error) {
    console.error("Erreur suppression projet:", error);
    return NextResponse.json({ erreur: "Erreur serveur." }, { status: 500 });
  }
}
