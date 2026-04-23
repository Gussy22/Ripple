import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseAdmin();
    const formData = await req.formData();

    const categorie = formData.get("categorie") as string;
    const destinatairePrenom = formData.get("destinatairePrenom") as string;
    const destinataireEmail = formData.get("destinataireEmail") as string;
    const organisateurEmail = formData.get("organisateurEmail") as string;
    const nombreEpisodes = Number(formData.get("nombreEpisodes"));
    const dateDebut = formData.get("dateDebut") as string;
    const titresEpisodes = JSON.parse(formData.get("titresEpisodes") as string) as string[];
    const contributeurs = JSON.parse(formData.get("contributeurs") as string) as { prenom: string; email: string }[];
    const jingleFile = formData.get("jingle") as File | null;

    // 1. Upload du jingle si présent
    let jingleUrl: string | null = null;
    if (jingleFile && jingleFile.size > 0) {
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

    // 2. Créer le projet
    const { data: projet, error: erreurProjet } = await supabase
      .from("projets")
      .insert({
        categorie,
        destinataire_prenom: destinatairePrenom,
        destinataire_email: destinataireEmail,
        organisateur_email: organisateurEmail,
        nombre_episodes: nombreEpisodes,
        jingle_url: jingleUrl,
        statut: "actif",
        date_debut: dateDebut,
      })
      .select()
      .single();

    if (erreurProjet || !projet) throw new Error("Impossible de créer le projet.");

    // 3. Créer les épisodes
    const episodesACreer = titresEpisodes.map((titre, i) => {
      const dateEnvoi = new Date(dateDebut);
      dateEnvoi.setDate(dateEnvoi.getDate() + i * 7);
      return {
        projet_id: projet.id,
        titre,
        numero: i + 1,
        date_envoi: dateEnvoi.toISOString().split("T")[0],
        statut: "en_attente",
      };
    });

    await supabase.from("episodes").insert(episodesACreer);

    // 4. Créer les contributeurs et envoyer les invitations
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    for (const contrib of contributeurs) {
      if (!contrib.email.trim()) continue;

      const token = crypto.randomUUID();

      await supabase.from("contributeurs").insert({
        projet_id: projet.id,
        email: contrib.email,
        prenom: contrib.prenom || contrib.email.split("@")[0],
        token,
      });

      // Envoyer l'email d'invitation
      await resend.emails.send({
        from: "Dearly <noreply@dearlyapp.fr>",
        to: contrib.email,
        subject: `${organisateurEmail.split("@")[0]} vous invite à participer au podcast de ${destinatairePrenom} 🎙️`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #111;">
            <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">dearly</h1>
            <p style="color: #555; margin-bottom: 32px;">Un podcast cadeau pour ${destinatairePrenom}</p>

            <p>Bonjour ${contrib.prenom || ""} 👋</p>
            <p>
              Vous avez été invité(e) à contribuer à un podcast surprise pour <strong>${destinatairePrenom}</strong>.
              Il vous suffit d'enregistrer un message vocal de <strong>3 à 5 minutes</strong> depuis votre navigateur.
            </p>
            <p>Pas besoin d'application, pas besoin de compte — juste votre voix.</p>

            <a href="${appUrl}/contribuer/${token}"
               style="display: inline-block; background: #111; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0;">
              Enregistrer mon message →
            </a>

            <p style="color: #999; font-size: 12px; margin-top: 32px;">
              Ce lien est personnel, ne le partagez pas.
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ id: projet.id });
  } catch (error) {
    console.error("Erreur création projet:", error);
    return NextResponse.json(
      { erreur: "Une erreur est survenue." },
      { status: 500 }
    );
  }
}
