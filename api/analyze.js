export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const { text, title, location, filled } = req.body;
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 250,
        messages: [{
          role: "user",
          content: `Corrige et classe cette note. Mission:"${title}" Lieu:"${location}"\nSections remplies:${filled || "aucune"}\nNote:"${text}"\nJSON:{"corrected":"...","section":"contexte|objectifs|activites|observations|resultats|recommandations|prochaines_etapes|divers","report_addition":"1-2 phrases rapport"}`
        }],
      }),
    });

    const data = await response.json();
    const raw = (data.content?.map(i => i.text || "").join("") || "").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);
    res.status(200).json(parsed);
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "AI processing failed", details: err.message });
  }
}
