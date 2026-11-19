import 'dotenv/config';
import Groq from "groq-sdk";

// Initialize multiple Groq clients if keys exist (GROQ_API_KEY_2 is tried first).
const keys = [process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY].filter(Boolean);
const clients = keys.map(apiKey => new Groq({ apiKey }));

// Groq retires models over time (llama-3.3-70b-versatile was removed), so the
// primary model is configurable and a second model is tried if it disappears.
const MODELS = [
  process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  process.env.GROQ_FALLBACK_MODEL || "qwen/qwen3.8-27b",
].filter((m, i, arr) => m && arr.indexOf(m) === i);

const TIMEOUT_MS = 15000;

let currentClientIndex = 0;

const isModelMissing = (error) =>
  error?.status === 404 || /model_not_found|decommissioned|does not exist/i.test(error?.message || "");

const isBadKey = (error) =>
  error?.status === 401 || /invalid_api_key|expired_api_key|Invalid API Key/i.test(error?.message || "");

const buildOptions = (model, messages, jsonMode, temperature) => {
  const options = { messages, model, temperature, max_tokens: 4096 };
  // gpt-oss models reason before answering; "low" keeps latency around 1-2s.
  if (model.startsWith("openai/gpt-oss")) options.reasoning_effort = "low";
  if (jsonMode) options.response_format = { type: "json_object" };
  return options;
};

const withTimeout = async (promise) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Groq timeout')), TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Perform a chat completion using Groq with key rotation and model fallback
 * @param {Array} messages - Array of message objects {role: "system"|"user"|"assistant", content: string}
 * @param {boolean} jsonMode - Ensure response is valid JSON
 * @param {number} temperature - Model temperature
 * @returns {string} - Response text
 */
export const getGroqChatCompletion = async (messages, jsonMode = false, temperature = 0.5) => {
  if (clients.length === 0) throw new Error("No Groq API keys configured");

  let lastError;
  for (let i = 0; i < clients.length; i++) {
    const groq = clients[currentClientIndex];
    for (const model of MODELS) {
      try {
        const chatCompletion = await withTimeout(
          groq.chat.completions.create(buildOptions(model, messages, jsonMode, temperature))
        );
        return chatCompletion.choices[0]?.message?.content || "";
      } catch (error) {
        lastError = error;
        console.warn(`Groq API Error (key ${currentClientIndex}, model ${model}):`, error.message);
        // Only a missing model is worth retrying on the same key with the next model.
        if (!isModelMissing(error)) break;
      }
    }
    // Rotate to the next key (bad key, rate limit, timeout, or all models missing).
    currentClientIndex = (currentClientIndex + 1) % clients.length;
    if (i < clients.length - 1) {
      console.log(`Retrying with fallback Groq key index ${currentClientIndex}${isBadKey(lastError) ? " (previous key invalid/expired)" : ""}...`);
    }
  }
  throw lastError;
};
