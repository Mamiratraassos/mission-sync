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
