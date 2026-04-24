import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { genererTokenMagicLink } from "@/lib/session";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ erreur: "Email invalide." }, { status: 400 });
    }

    const token = genererTokenMagicLink(email);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const lien = `${appUrl}/api/compte/auth?t=${token}`;

    await resend.emails.send({
      from: "Dearly <bonjour@dearly.fr>",
      to: email,
      subject: "Votre lien de connexion Dearly",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #111;">
          <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">dearly</h1>
          <p style="color: #555; margin-bottom: 32px;">Votre espace organisateur</p>

          <p>Cliquez sur le bouton ci-dessous pour accéder à votre espace et retrouver tous vos projets.</p>
          <p style="color: #888; font-size: 13px;">Ce lien est valable 1 heure.</p>

          <a href="${lien}"
             style="display: inline-block; background: #111; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0;">
            Accéder à mon espace →
          </a>

          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            Si vous n'avez pas demandé ce lien, ignorez cet email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ succes: true });
  } catch (error) {
    console.error("Erreur connexion:", error);
    return NextResponse.json({ erreur: "Erreur serveur." }, { status: 500 });
  }
}
