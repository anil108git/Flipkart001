// ─── LLM Client Abstraction ──────────────────────────────────────────────────
// Routes between Gemini (CI) and local LLM (dev) based on LLM_PROVIDER env var.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LLMResponse {
  text: string;
  provider: 'gemini' | 'local';
}

export type LLMProvider = 'gemini' | 'local';

// ─── Config ───────────────────────────────────────────────────────────────────

function getProvider(): LLMProvider {
  const provider = (process.env.LLM_PROVIDER ?? 'local').toLowerCase();
  if (provider === 'gemini') return 'gemini';
  return 'local';
}

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      '[llm-client] GEMINI_API_KEY env variable is not set.\n' +
      'Set it in .env.dev / .env.staging or as a CI secret.'
    );
  }
  return key;
}

function getLocalLlmUrl(): string {
  return process.env.LOCAL_LLM_URL ?? 'http://localhost:11434';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Call the configured LLM provider with a system prompt and user prompt.
 * Returns the raw text response.
 */
export async function callLLM(
  systemPrompt: string,
  userPrompt: string
): Promise<LLMResponse> {
  const provider = getProvider();
  console.log(`[llm-client] Using provider: ${provider}`);

  if (provider === 'gemini') {
    return callGemini(systemPrompt, userPrompt);
  }
  return callLocal(systemPrompt, userPrompt);
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

async function callGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<LLMResponse> {
  const apiKey = getGeminiApiKey();
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = JSON.stringify({
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`[llm-client] Gemini API error ${response.status}: ${text}`);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!text) {
    throw new Error('[llm-client] Gemini returned empty response');
  }

  return { text, provider: 'gemini' };
}

// ─── Local LLM (Ollama-compatible) ────────────────────────────────────────────

async function callLocal(
  systemPrompt: string,
  userPrompt: string
): Promise<LLMResponse> {
  const baseUrl = getLocalLlmUrl();
  const model = process.env.LOCAL_LLM_MODEL ?? 'llama3';
  const url = `${baseUrl}/api/generate`;

  const body = JSON.stringify({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    stream: false,
    options: {
      temperature: 0.1,
      num_predict: 4096,
    },
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`[llm-client] Local LLM error ${response.status}: ${text}`);
  }

  const data = await response.json() as { response?: string };

  const text = data.response ?? '';

  if (!text) {
    throw new Error('[llm-client] Local LLM returned empty response');
  }

  return { text, provider: 'local' };
}
