// This is the new, correct code for /api/index.js (Vercel)

export default async function handler(req, res) {
  // --- 1. Handle CORS Preflight (for browser security) ---
  // Vercel needs these headers to allow your frontend to call this
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    // This is the preflight request, send a 204 No Content
    return res.status(204).end();
  }

  // --- 2. Handle the POST Request ---
  if (req.method === "POST") {
    try {
      // 3. Get the prompt from the request body
      // Vercel automatically parses JSON, so req.body is the object
      const { prompt } = req.body;

      // 4. Get the secret API key from Vercel's environment
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY not set" });
      }

      // 5. Define the Google API URL and body
      const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const geminiRequestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      };

      // 6. Make the secure request to Google
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiRequestBody),
      });

      // 7. Check if Google returned an error
      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }

      // 8. Send Google's SUCCESS response back to the client
      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // --- 3. Handle any other methods ---
  return res.status(405).json({ error: "Method Not Allowed" });
}
