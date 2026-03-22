export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
 
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
 
  try {
    const { text, title, location, filled } = req.body || {};
    if (!text) return res.status(400).json({ error: "Missing text" });
 
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 250,
        messages: [{
          role: "user",
          content: `Corrige et classe cette note de mission terrain.
Mission: "${title || ""}"
Lieu: "${location || ""}"
Sections deja remplies: ${filled || "aucune"}
Note brute: "${text}"
 
Reponds UNIQUEMENT avec un objet JSON valide, sans backticks, sans texte avant ou apres:
{"corrected":"la note corrigee en francais professionnel","section":"une valeur parmi: contexte, objectifs, activites, observations, resultats, recommandations, prochaines_etapes, divers","report_addition":"1 a 2 phrases style rapport professionnel"}`
        }],
      }),
    });
 
    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic error:", response.status, errBody);
      return res.status(500).json({ error: "API error", status: response.status, details: errBody.substring(0, 300) });
    }
 
    const data = await response.json();
    const rawText = (data.content || []).map(item => item.text || "").join("");
    console.log("AI response:", rawText.substring(0, 300));
 
    let cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) {
      return res.status(500).json({ error: "No JSON found", raw: cleaned.substring(0, 200) });
    }
 
    const parsed = JSON.parse(cleaned.substring(start, end + 1));
    if (!parsed.corrected || !parsed.section || !parsed.report_addition) {
      return res.status(500).json({ error: "Incomplete response", parsed });
    }
 
    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({ error: "Failed", details: err.message });
  }
}
