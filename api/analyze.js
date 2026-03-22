export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "POST only"
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "ANTHROPIC_API_KEY non configurée dans Vercel"
    });
  }

  try {
    const { text, title, location, filled } = req.body || {};

    if (!text || !String(text).trim()) {
      return res.status(400).json({
        success: false,
        error: "Le champ text est requis"
      });
    }

    const prompt = `
Corrige cette note de mission en français professionnel.
Reste très concis.
Ne change pas le sens.
Retourne uniquement le texte corrigé.
N'ajoute aucun titre.
N'ajoute aucun markdown.
N'ajoute aucune explication.

Contexte :
- Mission : ${title || ""}
- Lieu : ${location || ""}
- Sections déjà remplies : ${filled || "aucune"}

Note :
${text}
`.trim();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 120,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const rawResponse = await response.text();

    console.log("Anthropic status:", response.status);
    console.log("Anthropic raw response:", rawResponse);

    if (!rawResponse || !rawResponse.trim()) {
      return res.status(502).json({
        success: false,
        error: "Réponse vide de l'API Anthropic"
      });
    }

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch (parseError) {
      return res.status(502).json({
        success: false,
        error: "Réponse Anthropic non JSON",
        raw: rawResponse
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data?.error?.message || "Erreur API Anthropic",
        details: data
      });
    }

    const improvedText =
      data?.content
        ?.map(item => item?.text || "")
        .join("")
        .trim() || text;

    return res.status(200).json({
      success: true,
      text: improvedText
    });

  } catch (err) {
    console.error("AI error:", err);

    return res.status(500).json({
      success: false,
      error: "AI processing failed",
      details: err.message
    });
  }
}
