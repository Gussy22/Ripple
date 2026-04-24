import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projetId } = await params;
    const supabase = supabaseAdmin();
    const body = await req.json();
    const { prenom, email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ erreur: "Email invalide." }, { status: 400 });
    }

    const { data: projet, error: errProjet } = await supabase
      .from("projets")
      .select("*")
      .eq("id", projetId)
      .single();

    if (errProjet || !projet) {
      return NextResponse.json({ erreur: "Projet introuvable." }, { status: 404 });
    }

    // Vérifier si ce contributeur existe déjà
    const { data: existant } = await supabase
      .from("contributeurs")
      .select("id")
      .eq("projet_id", projetId)
      .eq("email", email)
      .single();

    if (existant) {
      return NextResponse.json({ erreur: "Ce contributeur est déjà invité." }, { status: 409 });
    }

    const token = crypto.randomUUID();
    const prenomFinal = (prenom || "").trim() || email.split("@")[0];

    const { data: contributeur, error: errContrib } = await supabase
      .from("contributeurs")
      .insert({ projet_id: projetId, email, prenom: prenomFinal, token })
      .select()
      .single();

    if (errContrib || !contributeur) throw new Error("Impossible de créer le contributeur.");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await resend.emails.send({
      from: "Dearly <bonjour@dearly.fr>",
      to: email,
      subject: `Vous êtes invité(e) à participer au podcast de ${projet.destinataire_prenom}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #111;">
          <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">dearly</h1>
          <p style="color: #555; margin-bottom: 32px;">Un podcast cadeau pour ${projet.destinataire_prenom}</p>
          <p>Bonjour ${prenomFinal},</p>
          <p>Vous avez été invité(e) à enregistrer un message pour <strong>${projet.destinataire_prenom}</strong>.
          Pas besoin d'application, pas besoin de compte — juste votre voix.</p>
          <a href="${appUrl}/contribuer/${token}"
             style="display: inline-block; background: #111; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0;">
            Enregistrer mon message →
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">Ce lien est personnel, ne le partagez pas.</p>
        </div>
      `,
    });

    return NextResponse.json({ succes: true, contributeur });
  } catch (error) {
    console.error("Erreur ajout contributeur:", error);
    return NextResponse.json({ erreur: "Erreur serveur." }, { status: 500 });
  }
}
