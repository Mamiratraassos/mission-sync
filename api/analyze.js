export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "POST only" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: "API key not configured" });
  }

  try {
    const { text } = req.body || {};

    if (!text || !String(text).trim()) {
      return res.status(400).json({ success: false, error: "Text is required" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Corrige cette note de mission en français professionnel, sans changer le sens :\n\n${text}`
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
      data?.content?.map(item => item.text || "").join("").trim() || text;

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
