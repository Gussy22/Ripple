const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

// Utiliser le binaire FFmpeg inclus
ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.APP_URL || 'https://dearlyapp.fr';

// Vérifie que la requête vient bien de notre app
function verifierSecret(req) {
  return req.headers['x-service-secret'] === process.env.SERVICE_SECRET;
}

// Télécharge un fichier depuis une URL vers un chemin local
function telechargerFichier(url, destPath) {
  return new Promise((resolve, reject) => {
    const fichier = fs.createWriteStream(destPath);
    const protocole = url.startsWith('https') ? https : http;
    protocole.get(url, (reponse) => {
      reponse.pipe(fichier);
      fichier.on('finish', () => { fichier.close(); resolve(); });
      fichier.on('error', reject);
    }).on('error', reject);
  });
}

// Convertit un fichier audio en MP3 via FFmpeg
function convertirEnMp3(input, output) {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .audioCodec('libmp3lame')
      .audioBitrate(128)
      .on('end', resolve)
      .on('error', reject)
      .save(output);
  });
}

// Concatène plusieurs MP3 en un seul fichier
function concatenerAudio(fichiers, output, tmpDir) {
  return new Promise((resolve, reject) => {
    // Créer un fichier de liste pour FFmpeg
    const listePath = path.join(tmpDir, 'liste.txt');
    const contenu = fichiers.map(f => `file '${f}'`).join('\n');
    fs.writeFileSync(listePath, contenu);

    ffmpeg()
      .input(listePath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .audioCodec('libmp3lame')
      .audioBitrate(128)
      .on('end', resolve)
      .on('error', reject)
      .save(output);
  });
}

// Template email pour le destinataire
function emailDestinataire(projet, episode, audioUrl) {
  const numeroEmoji = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'][episode.numero - 1] || `#${episode.numero}`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9f9f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06);">

    <!-- En-tête -->
    <div style="background:#111;padding:32px;text-align:center;">
      <p style="color:#fff;font-size:26px;font-weight:700;margin:0;letter-spacing:-0.5px;">dearly</p>
      <p style="color:#888;font-size:13px;margin:6px 0 0;">Votre podcast personnel</p>
    </div>

    <!-- Corps -->
    <div style="padding:36px 32px;">
      <p style="font-size:22px;margin:0 0 6px;color:#111;">Bonjour ${projet.destinataire_prenom} 👋</p>
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px;">
        Un nouvel épisode de votre podcast vient d'arriver.<br>
        Des personnes qui vous sont chères ont enregistré leurs voix rien que pour vous.
      </p>

      <!-- Carte épisode -->
      <div style="background:#f5f5f3;border-radius:14px;padding:20px 24px;margin-bottom:28px;">
        <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">
          Épisode ${episode.numero} ${numeroEmoji}
        </p>
        <p style="margin:0;font-size:20px;font-weight:600;color:#111;">${episode.titre}</p>
      </div>

      <!-- Bouton écouter -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${audioUrl}"
           style="display:inline-block;background:#111;color:white;padding:14px 32px;border-radius:50px;text-decoration:none;font-size:15px;font-weight:600;">
          🎧 Écouter l'épisode
        </a>
        <p style="font-size:12px;color:#aaa;margin:10px 0 0;">
          Ou copiez ce lien : <a href="${audioUrl}" style="color:#888;">${audioUrl}</a>
        </p>
      </div>

      <hr style="border:none;border-top:1px solid #eee;margin:28px 0;">

      <p style="color:#aaa;font-size:12px;text-align:center;margin:0;">
        Prochain épisode la semaine prochaine ·
        <a href="${APP_URL}" style="color:#aaa;">dearly</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// Route principale : monter et envoyer un épisode
app.post('/traiter-episode', async (req, res) => {
  if (!verifierSecret(req)) {
    return res.status(401).json({ erreur: 'Non autorisé.' });
  }

  const { episodeId } = req.body;
  if (!episodeId) {
    return res.status(400).json({ erreur: 'episodeId requis.' });
  }

  // Répondre immédiatement pour ne pas bloquer le cron Vercel
  res.json({ statut: 'traitement_en_cours', episodeId });

  const tmpDir = path.join(os.tmpdir(), uuidv4());

  try {
    fs.mkdirSync(tmpDir, { recursive: true });

    // 1. Récupérer l'épisode et le projet
    const { data: episode, error: errEp } = await supabase
      .from('episodes')
      .select('*, projets(*)')
      .eq('id', episodeId)
      .single();

    if (errEp || !episode) throw new Error('Épisode introuvable.');
    const projet = episode.projets;

    // 2. Récupérer les enregistrements de cet épisode
    const { data: enregistrements } = await supabase
      .from('enregistrements')
      .select('*')
      .eq('episode_id', episodeId)
      .order('created_at');

    if (!enregistrements || enregistrements.length === 0) {
      console.log(`Aucun enregistrement pour l'épisode ${episodeId}, envoi annulé.`);
      return;
    }

    console.log(`Traitement de l'épisode ${episode.numero} — ${enregistrements.length} enregistrement(s)`);

    // 3. Télécharger et convertir le jingle
    let jingleMp3 = null;
    if (projet.jingle_url) {
      const jingleBrut = path.join(tmpDir, 'jingle_brut');
      await telechargerFichier(projet.jingle_url, jingleBrut);
      jingleMp3 = path.join(tmpDir, 'jingle.mp3');
      await convertirEnMp3(jingleBrut, jingleMp3);
    }

    // 4. Télécharger et convertir les enregistrements
    const enrMp3 = [];
    for (let i = 0; i < enregistrements.length; i++) {
      const brut = path.join(tmpDir, `enr_${i}_brut`);
      await telechargerFichier(enregistrements[i].audio_url, brut);
      const mp3 = path.join(tmpDir, `enr_${i}.mp3`);
      await convertirEnMp3(brut, mp3);
      enrMp3.push(mp3);
    }

    // 5. Construire la liste des segments : jingle + enr1 + jingle + enr2 + ...
    const segments = [];
    if (jingleMp3) segments.push(jingleMp3);
    for (let i = 0; i < enrMp3.length; i++) {
      segments.push(enrMp3[i]);
      if (jingleMp3 && i < enrMp3.length - 1) {
        segments.push(jingleMp3); // jingle entre chaque voix
      }
    }

    // 6. Concaténer en un seul MP3
    const outputPath = path.join(tmpDir, `episode_${episode.numero}.mp3`);
    await concatenerAudio(segments, outputPath, tmpDir);
    console.log(`Montage terminé : ${outputPath}`);

    // 7. Uploader sur Supabase Storage
    const nomFichier = `episodes/${projet.id}/episode_${episode.numero}.mp3`;
    const audioBuffer = fs.readFileSync(outputPath);

    await supabase.storage
      .from('audio')
      .upload(nomFichier, audioBuffer, { contentType: 'audio/mpeg', upsert: true });

    const { data: urlData } = supabase.storage.from('audio').getPublicUrl(nomFichier);
    const audioUrl = urlData.publicUrl;

    // 8. Mettre à jour l'épisode
    await supabase
      .from('episodes')
      .update({ statut: 'monte', audio_final_url: audioUrl })
      .eq('id', episodeId);

    // 9. Envoyer l'email au destinataire
    const { data: emailData, error: emailErreur } = await resend.emails.send({
      from: 'Dearly <bonjour@dearly.fr>',
      to: projet.destinataire_email,
      subject: `🎙️ Épisode ${episode.numero} — ${episode.titre}`,
      html: emailDestinataire(projet, episode, audioUrl),
    });

    if (emailErreur) {
      console.error('❌ Erreur Resend:', JSON.stringify(emailErreur));
      throw new Error(`Envoi email échoué : ${emailErreur.message}`);
    }

    console.log(`📧 Email envoyé, ID Resend : ${emailData?.id}`);

    // 10. Marquer comme envoyé
    await supabase
      .from('episodes')
      .update({ statut: 'envoye' })
      .eq('id', episodeId);

    console.log(`✅ Épisode ${episode.numero} envoyé à ${projet.destinataire_email}`);

  } catch (erreur) {
    console.error(`❌ Erreur traitement épisode ${episodeId}:`, erreur);
    await supabase
      .from('episodes')
      .update({ statut: 'erreur' })
      .eq('id', episodeId)
      .catch(() => {});
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// Route de santé (pour vérifier que Render est en ligne)
app.get('/health', (_req, res) => res.json({ statut: 'ok', service: 'dearly-audio' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🎙️ Service audio Dearly démarré sur le port ${PORT}`));
