// This is the corrected scripts.js file

const GEMINI_MODEL = "gemini-2.5-flash";

const editor = document.getElementById("editor");

const runBtn = document.getElementById("runBtn");
const outputEl = document.getElementById("output");
const diagPanel = document.getElementById("diagnostic");
const diagBody = document.getElementById("diagnosticBody");
const closeDiag = document.getElementById("closeDiag");

closeDiag.addEventListener("click", () => {
  diagPanel.classList.remove("open");
});

runBtn.addEventListener("click", async () => {
  const code = editor.textContent;
  if (!code.trim()) {
    outputEl.textContent = "No code to analyze. Start typing in the editor.";
    return;
  }

  outputEl.textContent = "Asking AI to simulate execution...";
  diagBody.textContent =
    "Analyzing code... (will show simple English diagnostic once ready)";
  diagPanel.classList.remove("open");

  try {
    const prompt = `You are an assistant that helps beginners understand code execution and find common mistakes.

Analyze this code and respond ONLY with valid JSON (no markdown, no extra text) in this exact format:
{
  "simulated_output": "what the code would output when run",
  "errors": "any compilation or runtime errors, or empty string if none",
  "diagnostic": "simple English explanation of what the code does and any issues found (mention line numbers)"
}

CODE_START
${code}
CODE_END

Remember: respond with ONLY the JSON object, nothing else.`;

    // --- FIX #1: Removed GEMINI_API_KEY from this call ---
    const responseText = await callGemini(prompt);

    let json = null;
    try {
      json = JSON.parse(responseText);
    } catch (e) {
      const start = responseText.indexOf("{");
      const end = responseText.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          json = JSON.parse(responseText.slice(start, end + 1));
        } catch (e2) {}
      }
    }

    if (json) {
      outputEl.textContent =
        json.simulated_output || json.errors || "No simulated output.";
      diagBody.textContent = json.diagnostic || "No diagnostic provided.";
    } else {
      outputEl.textContent = responseText;
      diagBody.textContent =
        "AI returned a non-JSON response. See output above for full text.";
    }

    setTimeout(() => diagPanel.classList.add("open"), 80);
  } catch (err) {
    outputEl.textContent = "API call failed: " + (err.message || err);
    diagBody.textContent =
      "Check your network and make sure the API key is correct in scripts.js";
    setTimeout(() => diagPanel.classList.add("open"), 80);
  }
});

// --- FIX #2: Removed apiKey parameter from this function definition ---
async function callGemini(prompt) {
  // We no longer pass the apiKey, we only need the prompt

  // Call your OWN backend function, not Google's API
  const url = "/api"; // Cloudflare Pages will route this to /functions/api.js

  const body = {
    prompt: prompt, // Just send the prompt
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API ${resp.status} ${resp.statusText} – ${text}`);
  }

  const data = await resp.json();

  // The rest of your function is the same...
  let text = "";
  try {
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = data.candidates[0].content.parts[0].text;
    } else {
      text = JSON.stringify(data);
    }
  } catch (e) {
    text = JSON.stringify(data);
  }

  return text;
}
