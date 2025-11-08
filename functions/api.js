// This file is: /functions/api.js

export async function onRequest(context) {
  // 1. Get the prompt from the client's request
  const clientRequestBody = await context.request.json();
  const prompt = clientRequestBody.prompt;

  // 2. Get the secret API key from Cloudflare's environment
  const GEMINI_API_KEY = context.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Define the Google API URL and body
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const geminiRequestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  // 4. Make the secure request to Google
  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(geminiRequestBody),
  });

  // 5. *** NEW ERROR CHECK ***
  // If the response from Google is not OK, send the error back
  if (!response.ok) {
    const errorData = await response.json();
    return new Response(JSON.stringify(errorData), {
      status: response.status, // Pass along Google's error status
      headers: { "Content-Type": "application/json" },
    });
  }

  // 6. Send Google's SUCCESS response back to the client
  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
