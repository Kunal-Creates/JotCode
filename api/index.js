// This is the corrected /functions/api.js file

// These headers allow your frontend to talk to your backend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow any origin
  "Access-Control-Allow-Methods": "POST, OPTIONS", // Allow these methods
  "Access-Control-Allow-Headers": "Content-Type", // Allow this header
};

/**
 * Handles the OPTIONS preflight request.
 * This is crucial for the browser to allow the real POST request.
 */
function handleOptions(request) {
  return new Response(null, {
    status: 204, // No Content
    headers: corsHeaders,
  });
}

/**
 * Handles the actual POST request to the Gemini API.
 */
async function handlePost(context) {
  try {
    // 1. Get the prompt from the client's request
    const clientRequestBody = await context.request.json();
    const prompt = clientRequestBody.prompt;

    // 2. Get the secret API key
    const GEMINI_API_KEY = context.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Define the Google API URL and body
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const geminiRequestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    // 4. Make the secure request to Google
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiRequestBody),
    });

    // 5. Check if Google returned an error
    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify(errorData), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Send Google's SUCCESS response back to the client
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

/**
 * Main export that handles all incoming requests
 */
export async function onRequest(context) {
  // Check the request method
  if (context.request.method === "OPTIONS") {
    // Handle the preflight request
    return handleOptions(context.request);
  } else if (context.request.method === "POST") {
    // Handle the main API request
    return handlePost(context);
  } else {
    // Disallow other methods
    return new Response(null, {
      status: 405,
      statusText: "Method Not Allowed",
    });
  }
}
