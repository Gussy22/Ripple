import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifierCookieSession, COOKIE_NAME } from "@/lib/session";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;

  if (!cookie) {
    return NextResponse.json({ erreur: "Non connecté." }, { status: 401 });
  }

  const email = verifierCookieSession(cookie);

  if (!email) {
    return NextResponse.json({ erreur: "Session invalide." }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  const { data: projets } = await supabase
    .from("projets")
    .select("id, destinataire_prenom, categorie, statut, date_debut, nombre_episodes, created_at")
    .eq("organisateur_email", email)
    .order("created_at", { ascending: false });

  return NextResponse.json({ email, projets: projets || [] });
}
