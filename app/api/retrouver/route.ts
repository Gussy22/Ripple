import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ erreur: "Email invalide." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data: projets } = await supabase
      .from("projets")
      .select("id, destinataire_prenom, categorie")
      .eq("organisateur_email", email)
      .order("created_at", { ascending: false });

    // On répond toujours "succès" pour ne pas révéler si l'email existe
    if (!projets || projets.length === 0) {
      return NextResponse.json({ succes: true });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const projetsHtml = projets.map(p => `
      <p style="margin: 16px 0; padding: 16px; background: #f9f6f1; border-radius: 12px;">
        <strong>Podcast pour ${p.destinataire_prenom}</strong><br>
        <span style="color: #888; font-size: 13px;">${p.categorie}</span><br>
        <a href="${appUrl}/projet/${p.id}"
           style="color: #111; font-weight: 600; text-decoration: none; font-size: 14px;">
          Accéder au tableau de bord →
        </a>
      </p>
    `).join("");

    await resend.emails.send({
      from: "Dearly <bonjour@dearly.fr>",
      to: email,
      subject: "Vos projets Dearly",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #111;">
          <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">dearly</h1>
          <p style="color: #555; margin-bottom: 24px;">Voici les liens vers vos tableaux de bord :</p>
          ${projetsHtml}
          <p style="color: #999; font-size: 12px; margin-top: 32px;">Ces liens sont personnels, ne les partagez pas.</p>
        </div>
      `,
    });

    return NextResponse.json({ succes: true });
  } catch (error) {
    console.error("Erreur retrouver:", error);
    return NextResponse.json({ erreur: "Erreur serveur." }, { status: 500 });
  }
}
