export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
 
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
 
  try {
    const { text, title, location, filled } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text" });
 
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-3-5-20241022",
        max_tokens: 250,
        messages: [{
          role: "user",
          content: `Corrige et classe cette note de mission terrain.
Mission: "${title || ""}"
Lieu: "${location || ""}"
Sections deja remplies: ${filled || "aucune"}
Note brute: "${text}"
 
Reponds UNIQUEMENT avec un objet JSON valide, sans backticks, sans texte avant ou apres:
{"corrected":"la note corrigee en style professionnel","section":"une valeur parmi: contexte, objectifs, activites, observations, resultats, recommandations, prochaines_etapes, divers","report_addition":"1 a 2 phrases en style rapport professionnel a ajouter dans cette section"}`
        }],
      }),
    });
 
    // Check if Anthropic API returned an error
    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic API error:", response.status, errBody);
      return res.status(500).json({ 
        error: "Anthropic API error", 
        status: response.status,
        details: errBody.substring(0, 200)
      });
    }
 
    const data = await response.json();
    
    // Extract text from response
    const rawText = (data.content || []).map(item => item.text || "").join("");
    console.log("AI raw response:", rawText.substring(0, 300));
 
    // Clean and parse JSON
    let cleaned = rawText.trim();
    // Remove markdown code fences if present
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    // Find the JSON object
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("No JSON found in response:", cleaned);
      return res.status(500).json({ error: "No JSON in AI response", raw: cleaned.substring(0, 200) });
    }
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
 
    const parsed = JSON.parse(cleaned);
    
    // Validate required fields
    if (!parsed.corrected || !parsed.section || !parsed.report_addition) {
      console.error("Missing fields in parsed JSON:", parsed);
      return res.status(500).json({ error: "Incomplete AI response", parsed });
    }
 
    res.status(200).json(parsed);
  } catch (err) {
    console.error("AI error:", err.message, err.stack);
    res.status(500).json({ error: "AI processing failed", details: err.message });
  }
}
