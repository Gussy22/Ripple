import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { categorie, prenom, nombre } = await req.json();

    const prompt = `Tu es un assistant qui crée des titres d'épisodes pour un podcast cadeau.

Contexte : Un groupe de proches crée un podcast personnalisé pour offrir à ${prenom} à l'occasion de son/sa ${categorie}.
Le podcast aura ${nombre} épisodes hebdomadaires.

Génère exactement ${nombre} titres d'épisodes créatifs, chaleureux et personnalisés en français.
Chaque titre doit être court (3 à 7 mots), poétique et évocateur.
Varie les thèmes : souvenirs, messages d'amour, anecdotes, espoirs pour l'avenir, etc.

Réponds UNIQUEMENT avec un tableau JSON de ${nombre} chaînes de texte, sans aucun autre texte.
Exemple : ["Titre 1", "Titre 2", "Titre 3"]`;

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const contenu = message.content[0].type === "text" ? message.content[0].text : "[]";
    const titres = JSON.parse(contenu);

    return NextResponse.json({ titres });
  } catch (error) {
    console.error("Erreur génération titres:", error);
    return NextResponse.json(
      { titres: [] },
      { status: 200 }
    );
  }
}
